const { errorResponder, errors } = require('../../../../core/errors');
const db = require('../../../../database/db');
const logger = require('../../../../core/logger')('user-repository');

async function findByEmail(email) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'SELECT user_id, google_id, email, username, password, verified FROM users WHERE email = $1',
            [email]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({err}, 'Terjadi error database di modul user!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function createUser(username, email, phone_no, passwordHash) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'INSERT INTO users (username, email, phone_no, password) VALUES ($1, $2, $3, $4) RETURNING email',
            [username, email, phone_no, passwordHash]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({err}, 'Terjadi error database di modul user!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function changeProfileWhereId(profile, user_id) {
    let res, clientref;

    const profileValues = Object.values(profile); 

    let count = 1
    let clauses = [];

    for (const key in profile) {
        clauses.push((key + ' = ' + '$' + count.toString()));
        count++;
    }

    const clausesStr = clauses.join(", "); 

    await db.connect().then(async (client) => {
        clientref = client;

        await client.query(
            `UPDATE users SET ${clausesStr}
                WHERE user_id = $${count}`,
            [...profileValues, user_id]

        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({err}, 'Terjadi error database di modul user!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function getProfileById(id) {
    await db.connect().then(async (client) => {
        clientref = client;

        await client.query(
            `SELECT username, email, profile_image_url, phone_no FROM users WHERE user_id = $1`,
            [id]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({err}, 'Terjadi error database di modul user!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

module.exports = {
    findByEmail,
    createUser,
    changeProfileWhereId,
    getProfileById,
}