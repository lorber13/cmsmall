'use strict';
import dayjs from 'dayjs';
const APIURL = 'http://localhost:3000/api';

async function getSiteTitle() {
    try {
        const response = await fetch(APIURL + '/title');
        if (response.ok) {
            const title = await response.json();
            return title.value;
        } else {
            const message = await response.text();
            throw new Error(message);
        }
    } catch (error) {
        throw new Error(error.message, {cause: error})
    }
}

async function getPublishedPages() {
    try {
        const response = await fetch(APIURL + '/published-pages');
        if (response.ok) {
            let pages = await response.json();
            pages = pages.sort((a, b) => {
                return dayjs(a.publicationDate).isAfter(dayjs(b.publicationDate), 'day');
            })
            return pages;
        } else {
            const message = await response.text();
            throw new Error(message);
        }
    } catch (error) {
        throw new Error(error.message, {cause: error})
    }
}

async function logIn(username, password) {
    try {
        const response = await fetch(APIURL + `/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({username: username, password: password}),
            credentials: 'include',
        });
        if (response.ok) {
            const contents = await response.json();
            return contents;
        } else {
            const message = await response.text();
            throw new Error(message);
        }
    } catch (error) {
        throw new Error(error.message, {cause: error})
    }
}

async function getPages() {
    try {
        const response = await fetch(APIURL + '/pages', {
            credentials: 'include'
        });
        if (response.ok) {
            let pages = await response.json();
            return pages;
        } else {
            const message = await response.text();
            throw new Error(message);
        }
    } catch (error) {
        throw new Error(error.message, {cause: error})
    }
}

async function deletePage(id) {
    try {
        const response = await fetch(APIURL + `/pages/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (response.ok) {
            let pages = await response.json();
            return pages;
        } else {
            const message = await response.text();
            throw new Error(message);
        }
    } catch (error) {
        throw new Error(error.message, {cause: error})
    }

}
async function addPage(title, date, contents) {
    try {
        const body = JSON.stringify({
                title: title,
                publicationDate: date,
                contents: contents
        })
        const response = await fetch(APIURL + `/pages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body,            
            credentials: 'include'
        });
        if (response.ok) {
            let page = await response.json();
            return page;
        } else {
            const message = await response.text();
            throw new Error(message);
        }
    } catch (error) {
        throw new Error(error.message, {cause: error})
    }
}

async function editPage(id, title, date, author, contents) {
    try {
        const body = JSON.stringify({
                title: title,
                publicationDate: date,
                author: author,
                contents: contents
        })
        const response = await fetch(APIURL + `/pages/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body,            
            credentials: 'include'
        });
        if (response.ok) {
            let page = await response.json();
            return page;
        } else {
            const message = await response.text();
            throw new Error(message);
        }
    } catch (error) {
        throw new Error(error.message, {cause: error})
    }
}

async function getAuthors() {
    try {
        const response = await fetch(APIURL + '/users', {
            credentials: 'include'
        });
        if (response.ok) {
            let authors = await response.json();
            return authors;
        } else {
            const message = await response.text();
            throw new Error(message);
        }
    } catch (error) {
        throw new Error(error.message, {cause: error})
    }
}

async function setAPITitle(title) {
    try {
        const response = await fetch(APIURL + `/title`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({value: title}),
            credentials: 'include',
        });
        if (response.ok) {
            const contents = await response.json();
            return contents;
        } else {
            const message = await response.text();
            throw new Error(message);
        }
    } catch (error) {
        throw new Error(error.message, {cause: error})
    }

}

async function logOut() {
    try {
        const response = await fetch(APIURL + `/sessions/current`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (response.ok) {
            return true;
        } else {
            const message = await response.text();
            throw new Error(message);
        }
    } catch (error) {
        throw new Error(error.message, {cause: error})
    }
}

export { getSiteTitle, getPublishedPages, setAPITitle, logIn, logOut, getPages, deletePage, editPage, addPage, getAuthors };