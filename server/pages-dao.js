'use strict';

const dayjs = require('dayjs');

const {db} = require('./db');

// gets the published pages (without their content)
exports.getPublishedPages = () => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT pages.id, pages.title, users.name as author, pages.creationDate, pages.publicationDate FROM users, pages WHERE users.id = pages.author AND publicationDate <= ?";
        const today = dayjs().format('YYYY-MM-DD');
        db.all(sql, [today], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const pages = rows.map((page) => ({
                    id: page.id,
                    title: page.title,
                    author: page.author,
                    creationDate: page.creationDate,
                    publicationDate: page.publicationDate
                }));
                resolve(pages);
            }
        })
    })
}

exports.getAllPages = () => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT pages.id, pages.title, users.name as author, pages.creationDate, pages.publicationDate FROM users, pages WHERE users.id = pages.author";
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const pages = rows.map((page) => ({
                    id: page.id,
                    title: page.title,
                    author: page.author,
                    creationDate: page.creationDate,
                    publicationDate: page.publicationDate
                }));
                resolve(pages);
            }
        })
    })
}

exports.getContentsOfPage = (id) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM contents WHERE pageId = ?";
        db.all(sql, [id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                if (rows.length === 0) {
                    resolve(false);
                } else {
                    const contents = rows.map((content) => ({
                        id: content.id,
                        type: content.type,
                        value: content.value,
                        pageId: content.pageId,
                        position: content.position
                    }));
                    resolve(contents);
                }
            }
        })
    })
}

exports.getTitle = () => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT value FROM siteTitle";
        db.get(sql, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        })
    })
}

exports.createPage = (page) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO pages(title, author, creationDate, publicationDate) VALUES(?,?,?,?)";
        db.run(sql, [page.title, page.author, page.creationDate, page.publicationDate], function(err) {
            if (err) {
                reject(err);
            } else {
                exports.getPage(this.lastID).then((page) => {
                    resolve(page);
                }).catch((err) => {
                    reject(err);
                })
            }
        })
    })
}

exports.getPage = (id) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM pages WHERE id = ?";
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                if (row === undefined) {
                    resolve(false);
                } else {
                    const page = {
                        id: row.id,
                        title: row.title,
                        author: row.author,
                        creationDate: row.creationDate,
                        publicationDate: row.publicationDate
                    };
                    resolve(page);
                }
            }
        })
    })
}

exports.createContent = (content) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO contents(type, value, pageId, position) VALUES(?,?,?,?)";
        db.run(sql, [content.type, content.value, content.pageId, content.position], function(err) {
            if (err) {
                reject(err);
            } else {
                getContent(this.lastID).then((content) => {
                    resolve(content);
                }).catch((err) => {
                    reject(err);
                })
            }
        })
    })
}

function getContent(id) {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM contents WHERE id = ?";
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                if (row === undefined) {
                    resolve(false);
                } else {
                    const content = {
                        type: row.type,
                        value: row.value,
                        pageId: row.pageId,
                        position: row.position
                    };
                    resolve(content);
                }
            }
        })
    })
}

exports.setTitle = (title) => {
    return new Promise((resolve, reject) => {
        const sql = "UPDATE siteTitle SET value=? WHERE id=1";
        db.run(sql, [title], function(err) {
            if (err) {
                reject(err);
            } else {
                exports.getTitle().then((title) => {
                    resolve(title);
                }).catch((err) => {
                    reject(err);
                })
            }
        })
    })
}

exports.modifyPage = (pageId, title, author, publicationDate) => {
    return new Promise((resolve, reject) => {
        const sql = "UPDATE pages SET title=?, author=?, publicationDate=? WHERE id=?";
        db.run(sql, [title, author, publicationDate, pageId], function(err) {
            if (err) {
                reject(err);
            } else {
                if (this.changes !== 1) {
                    resolve(false);
                } else {
                    exports.getPage(pageId).then((page) => {
                        resolve(page);
                    }).catch((err) => {
                        reject(err);
                    })
                }
            }
        })
    }) 
}

exports.getCreationDateOfPage = (pageId) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT creationDate FROM pages WHERE id = ?";
        db.get(sql, [pageId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                if (row === undefined) {
                    resolve(false);
                } else {
                    resolve(row.creationDate);
                }
            }
        })
    })
}

exports.deleteContentsOfPage = (pageId) => {
    return new Promise((resolve, reject) => {
        const sql = "DELETE FROM contents WHERE pageId=?";
        db.run(sql, [pageId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(null);
            }
        })
    })
}

exports.deletePage = (pageId) => {
    return new Promise((resolve, reject) => {
        const sql = "DELETE FROM pages WHERE id=?";
        db.run(sql, [pageId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(null);
            }
        })
    })
}

exports.getAllUsers = () => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT name FROM users";
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const users = rows.map((user) => ({
                    name: user.name
                }));
                resolve(users);
            }
        })
    })
}