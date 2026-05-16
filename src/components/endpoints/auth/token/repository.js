const { errorResponder, errors } = require('../../../../core/errors');
const db = require('../../../../database/db');
const {logger} = require('../../../../core/logger');
const config = require('../../../../core/config');

async function addInvalid(exp, jti) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            // konversikan unix ke timestamp with time zone pg
            `INSERT INTO jti_blacklists (expires_at, jti) VALUES (to_timestamp($1), $2)`,
            [exp, jti]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di tabel jti blacklist!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function findJti(jti) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `SELECT 1 FROM jti_blacklists WHERE jti = $1`,
            [jti]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di tabel jti blacklist!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function addRefreshToken(token = "", account_id = "", is_admin, expires_at) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `INSERT INTO refresh_tokens (token, account_id, is_admin) VALUES ($1, $2, $3)`,
            [token, account_id, is_admin]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function findRefreshTokens(account_id = "", is_admin) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `SELECT token FROM refresh_tokens WHERE account_id = $2 AND is_admin = $2`,
            [account_id, is_admin]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function deleteRefreshToken(token = "", account_id = "", is_admin) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `DELETE FROM refresh_tokens WHERE token = $1 AND account_id = $2 AND is_admin = $3`,
            [token, account_id, is_admin]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

module.exports = {
    addInvalid,
    findJti,
    addRefreshToken,
    deleteRefreshToken,
    findRefreshTokens
}