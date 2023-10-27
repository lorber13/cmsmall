'use strict';

const PORT = 3000;

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const userDao = require('./user-dao');
const pagesDao = require('./pages-dao');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const { check, validationResult } = require('express-validator');
const dayjs = require('dayjs');
const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
};

const app = express();
app.use(morgan('combined'));
app.use(express.json());
app.use(cors(corsOptions));
app.use('/static', express.static('public'));

passport.use(new LocalStrategy(function verify(username, password, callback) {
    userDao.checkUser(username, password).then((user) => {
        if (!user) {
            return callback(null, false, { message: 'Incorrect username and/or password.' });
        }
        return callback(null, user);
    }).catch((err) => {
        return callback(err);
    })
}));

passport.serializeUser((user, callback) => {
    return callback(null, user);
})

passport.deserializeUser((user, callback) => {
    return callback(null, user);
})

const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(400).send("Not authenticated");
}

app.use(session({
    secret: "Va bene, allora. Tieniti pure i tuoi segreti",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.authenticate('session'));

/* APIs */

app.post('/api/sessions', function(req, res, next) {
    passport.authenticate('local', (err, user, info) => {
        if (err)
            return next(err);
        if (!user)
            return res.status(401).send(info.message);
        req.login(user, (err) => {
            if (err)
                return next(err);
            return res.json(req.user);
        });
    }) (req, res, next);
});

app.delete('/api/sessions/current', (req, res) => {
    req.logout(() => {
        res.end();
    });
})

// to get the current user you must be logged in
app.get('/api/sessions/current', isLoggedIn, (req, res) => {
    res.json(req.user);
})

app.get('/api/pages', isLoggedIn, async (req, res) => {
    try {
        const pages = await pagesDao.getAllPages();
        for (const page of pages) {
            const contents = await pagesDao.getContentsOfPage(page.id);
            page.contents = contents;
        }
        return res.json(pages);
    } catch (error) {
        return res.status(500).send(error.message);
    }
})

app.get('/api/published-pages',  async (req, res) => {
    try {
        const pages = await pagesDao.getPublishedPages();
        for (const page of pages) {
            const contents = await pagesDao.getContentsOfPage(page.id);
            page.contents = contents;
        }
        return res.json(pages);
    } catch (error) {
        return res.status(500).send(error.message);
    }
})

app.get('/api/title', (req, res) => {
    pagesDao.getTitle().then((title) => {
        res.json(title);
    }).catch((error) => {
        res.status(500).send(error.message);
    })
})

// create a page
app.post('/api/pages', isLoggedIn, [
    check('title').isLength({min: 1, max: 150}),
    check('publicationDate').isISO8601({strict: true}).optional({values: 'null'})
], async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) 
        return res.status(403).send("Invalid parameters");
    if (req.body.publicationDate && dayjs(req.body.publicationDate).isBefore(dayjs(), 'day'))
        return res.status(403).send("Cannot create a page whose publicationDate is before the creationDate (today)");
    if (!req.body.contents || req.body.contents.length < 2) 
        return res.status(403).send("Not enough contents");
    let isAtLeastAnHeaderPresent = false;
    let isAtLeastAContentNotHeaderPresent = false;
    for(let content of req.body.contents) {
        if (!content.type)
            return res.status(403).send("Some content has not a type defined");
        if (!content.value)
            return res.status(403).send("Some content has not a value defined");
        if (content.type == 'header')
            isAtLeastAnHeaderPresent = true;
        if (content.type == 'image' || content.type == 'paragraph')
            isAtLeastAContentNotHeaderPresent = true;
        if (content.type != 'header' && content.type != 'image' && content.type != 'paragraph')
            return res.status(403).send("Some content has an invalid type");
        if (content.type == 'image' && content.value != 'racket.jpg' 
                                    && content.value != 'ball.jpg'
                                    && content.value != 'shot.jpg'
                                    && content.value != 'play.jpg')
            return res.status(403).send("An image content has an invalid image name");
    }
    if (isAtLeastAContentNotHeaderPresent === false || isAtLeastAnHeaderPresent === false)
        return res.status(403).send("A page must have at least an header and at least one of the other two types of blocks");
    // by using req.user.id as author field, I guarantee that a page with a wrong author cannot be created
    const pageToBeInserted = {
        title: req.body.title,
        author: req.user.id,
        creationDate: dayjs().format("YYYY-MM-DD"),
        publicationDate: req.body.publicationDate
    };
    try {
        const createdPage = await pagesDao.createPage(pageToBeInserted);
        createdPage.contents = [];
        let position = 0;
        for (let content of req.body.contents) {
            const contentToBeInserted = {
                type: content.type,
                value: content.value,
                pageId: createdPage.id,
                position: position
            };
            const createdContent = await pagesDao.createContent(contentToBeInserted);
            createdPage.contents[position] = createdContent;
            position++;
        }
        return res.json(createdPage);
    } catch (error) {
        return res.status(500).send(error.message);
    }
})

// edit a page (keeping its creationDate unmodified) (only the admin can modify the author)
// if you sumbit in the body a page without specifying the publicationDate, you are setting the new publicationDate to null!
app.put('/api/pages/:pageId', isLoggedIn, [
    check('pageId').isInt({min: 1}),
    check('title').isLength({min: 1, max: 50}),
    check('author').optional({values: 'null'}),
    check('publicationDate').isISO8601({strict: true}).optional({values: 'null'})
], async (req, res) => {
    const result = validationResult(req);
    let user;
    if (!result.isEmpty())
        return res.status(403).send("Invalid parameters");
    if (req.body.author && !req.user.admin)
        return res.status(403).send("If you are not admin you cannot change the author of a page");
    try {
        const pageToBeModified = await pagesDao.getPage(req.params.pageId);
        if (!pageToBeModified)
            return res.status(404).send("The page you want to modify does not exist");
        // if the page exists but req.body.author does not exist (the admin is trying to set an author who does not exist)
        if (req.body.author) {
            user = await userDao.getUser(req.body.author);
            if (!user) return res.status(403).send("The author you want to set does not exist");
        }
        if (pageToBeModified.author !== req.user.id && !req.user.admin)
            return res.status(403).send("You can't modify this page because you are not its author");
        if (req.body.publicationDate && dayjs(req.body.publicationDate).isBefore(pageToBeModified.creationDate, 'day'))
            return res.status(403).send("Cannot set a publicationDate which is before the creationDate of the page you want to modify");
        if (!req.body.contents || req.body.contents.length < 2) 
            return res.status(403).send("Not enough contents");
        let isAtLeastAnHeaderPresent = false;
        let isAtLeastAContentNotHeaderPresent = false;
        for(let content of req.body.contents) {
            if (!content.type)
                return res.status(403).send("Some content has not a type defined");
            if (!content.value)
                return res.status(403).send("Some content has not a value defined");
            if (content.type == 'header')
                isAtLeastAnHeaderPresent = true;
            if (content.type == 'image' || content.type == 'paragraph')
                isAtLeastAContentNotHeaderPresent = true;
            if (content.type != 'header' && content.type != 'image' && content.type != 'paragraph')
                return res.status(403).send("Some content has an invalid type");
            if (content.type == 'image' && content.value != 'racket.jpg' 
                                        && content.value != 'ball.jpg'
                                        && content.value != 'shot.jpg'
                                        && content.value != 'play.jpg')
                return res.status(403).send("An image content has an invalid image name");
        }
        if (isAtLeastAContentNotHeaderPresent === false || isAtLeastAnHeaderPresent === false)
            return res.status(403).send("A page must have at least an header and at least one of the other two types of blocks");
        // I first delete the old contents, then reinsert new contents
        await pagesDao.deleteContentsOfPage(req.params.pageId);
        const modifiedPage = await pagesDao.modifyPage(pageToBeModified.id, req.body.title, req.body.author? user.id : pageToBeModified.author, req.body.publicationDate); // to be tested
        modifiedPage.contents = [];
        let position = 0;
        for (let content of req.body.contents) {
            const contentToBeInserted = {
                type: content.type,
                value: content.value,
                pageId: modifiedPage.id,
                position: position
            };
            const createdContent = await pagesDao.createContent(contentToBeInserted);
            modifiedPage.contents[position] = createdContent;
            position++;
        }
        return res.json(modifiedPage);
    } catch (error) {
        return res.status(500).send(error.message);
    }
})

// delete a page (deleting also the contents of that page)
app.delete('/api/pages/:pageId', isLoggedIn, [
    check('pageId').isInt({ min: 1 })
], async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) return res.status(403).send("Invalid url");
    try {
        const page = await pagesDao.getPage(req.params.pageId);
        // the deletion of a non existent page will not produce an error
        if (page && page.author !== req.user.id && !req.user.admin)
            return res.status(403).send("You can't delete this page because you are not its author");
        await pagesDao.deleteContentsOfPage(req.params.pageId);
        await pagesDao.deletePage(req.params.pageId);
        return res.json({});
    } catch (error) {
        return res.status(500).send(error.message);
    }
})

// edit the website title
app.put('/api/title', isLoggedIn, [
    check('value').isString().isLength({max: 50}),
], (req, res) => {
    if (!req.user.admin)
        return res.status(403).send("Error: non-admin users cannot modify the entire website title");
    const result = validationResult(req);
    if (!result.isEmpty())
        return res.status(403).send("Error: the title format is not valid");
    pagesDao.setTitle(req.body.value).then((title) => {
        return res.json(title);
    }).catch((error) => {
        return res.status(500).send(error.message);
    })
})

// get all users. Only admins can see all the names of the users in the database. Only the name is returned
app.get('/api/users', isLoggedIn, (req, res) => {
    if (!req.user.admin)
        return res.status(403).send("Error: non-admin users cannot see the entire users list");
    pagesDao.getAllUsers().then((users) => {
        res.json(users);
    }).catch((error) => {
        res.status(500).send(error.message);
    })
})


app.listen(PORT, () => { console.log(`Server started on http://localhost:${PORT}/`) });