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

module.exports = {
    addInvalid,
    findJti,
}