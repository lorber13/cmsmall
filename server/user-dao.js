'use strict';

/* Data Access Object (DAO) module for accessing users */

const {db} = require('./db');
const crypto = require('crypto');

exports.checkUser = (email, password) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE email = ?';
        db.get(sql, [email], (err,row) => {
            if (err) { // errore sql
                reject(err);
            } else if (row === undefined) { // non esiste user con questa email
                resolve(false);
            } else {
                const user = {
                    id: row.id,
                    username: row.email,
                    name: row.name,
                    admin: row.admin === 1? true : false
                }
                const salt = row.salt;
                crypto.scrypt(password, salt, 32, (err, hashedPassword) => {
                    if (err) reject(err);
                    else if (!crypto.timingSafeEqual(Buffer.from(row.hash, 'hex'), hashedPassword)) // la password e' sbagliata
                        resolve(false);
                    else
                        resolve(user);
                })
            }
        })
    })
}

exports.getUser = (name) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM users WHERE name = ?";
        db.get(sql, [name], (err, row) => {
            if (err) {
                reject(err);
            } else {
                if (row === undefined) {
                    resolve(false);
                } else {
                    const user = {
                        id: row.id,
                        username: row.email,
                        name: row.name,
                        admin: row.admin === 1? true : false
                    };
                    resolve(user);
                }
            }
        })
    })
}