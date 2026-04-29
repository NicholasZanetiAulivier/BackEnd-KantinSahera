const { errorResponder, errors } = require('../../../../core/errors');
const db = require('../../../../database/db');

async function findByEmail(email) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'SELECT user_id, google_id, email, username, password FROM users WHERE email = $1',
            [email]
        ).then(result => {
            res = result
        }).catch((err) => {
            throw errorResponder(errors.DB, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function createUser(username, email, passwordHash) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING email',
            [username, email, passwordHash]
        ).then(result => {
            res = result
        }).catch((err) => {
            console.log(err);
            throw errorResponder(errors.DB, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function changeUsernameWhereEmail(username, email) {
        let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'UPDATE users SET username = $1 WHERE email = $2',
            [username, email]
        ).then(result => {
            res = result
        }).catch((err) => {
            console.log(err);
            throw errorResponder(errors.DB, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

module.exports = {
    findByEmail,
    createUser,
    changeUsernameWhereEmail,
}