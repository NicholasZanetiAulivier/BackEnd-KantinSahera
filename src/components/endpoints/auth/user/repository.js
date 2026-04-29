const { errorResponder, errors } = require('../../../../core/errors');
const db = require('../../../../database/db');

// Yea ok we need to tidy this up

async function findEmail(email) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'SELECT email FROM users WHERE email = $1',
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

async function createUser(user) {
    const { username, email, password } = user;

    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
            [username, email, password]
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
    findEmail,
    createUser,
}