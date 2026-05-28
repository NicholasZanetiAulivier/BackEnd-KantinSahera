const { errorResponder, errors } = require('../../../../core/errors');
const db = require('../../../../database/db');
const { logger } = require('../../../../core/logger');
const config = require('../../../../core/config');
const { v4: uuidv4 } = require('uuid');

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

async function addRefreshToken(token = "", account_id = "", is_admin) {
    let res, clientref;
    const id = uuidv4();

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `INSERT INTO refresh_tokens (id, token, account_id, is_admin) VALUES ($1, $2, $3, $4)
                RETURNING id`,
            [id, token, account_id, is_admin]
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

async function findRefreshToken(token_id = "", account_id = "", is_admin) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `SELECT token, is_revoked, expires_at FROM refresh_tokens 
                WHERE id = $1 AND account_id = $2 AND is_admin = $3`,
            [token_id, account_id, is_admin]
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

async function setRefreshTokenRevoked(token_id = "", account_id = "", is_admin) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `UPDATE refresh_tokens SET is_revoked = $1 
                WHERE id = $2 AND account_id = $3 AND is_admin = $4`,
            [true, token_id, account_id, is_admin]
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

async function deleteRefreshTokens(account_id = "", is_admin) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `DELETE FROM refresh_tokens WHERE account_id = $1 AND is_admin = $2
                RETURNING 1`,
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


async function deleteRefreshToken(token_id = "", account_id = "", is_admin) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `DELETE FROM refresh_tokens WHERE account_id = $1 AND is_admin = $2 AND id = $3
                RETURNING 1`,
            [account_id, is_admin, token_id]
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
    deleteRefreshTokens,
    deleteRefreshToken,
    findRefreshToken,
    setRefreshTokenRevoked
}