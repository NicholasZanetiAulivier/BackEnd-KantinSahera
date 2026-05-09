const { errorResponder, errors } = require('../../../../core/errors');
const db = require('../../../../database/db');
const {logger} = require('../../../../core/logger');
const config = require('../../../../core/config');

getTableName = (isAdmin) => isAdmin ? 'admins' : 'users';

async function saveOTP(email, otp, is_admin) {
    let res, clientref;

    // kasih 10 menit
    const expires_at = new Date(Date.now() + config.otp_time * 60 * 1000);
    const attempt_count = 1; // percobaan input otp

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `INSERT INTO account_otps (email, otp, expires_at, attempt_count , is_admin)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (email, is_admin) DO UPDATE
                SET otp = $2, created_at = NOW(), expires_at = $3, attempt_count = $4
            `,
            [email, otp, expires_at, attempt_count, is_admin]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di verifikasi!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function findOTP(email, is_admin) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'SELECT * FROM account_otps WHERE email = $1 AND is_admin = $2',
            [email, is_admin]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di verifikasi!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function deleteOTP(email, is_admin) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'DELETE FROM account_otps WHERE email = $1 AND is_admin = $2;',
            [email, is_admin]
        ).then(result => {
            res = result
        }).catch((err) => {
            console.log(err);
            logger.error({ err }, 'Terjadi error database di verifikasi!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function incrementAttemptsCount(email, is_admin) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `UPDATE account_otps SET attempt_count = attempt_count + 1 
                WHERE email = $1 AND is_admin = $2`,
            [email, is_admin]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({ err }, 'Terjadi error database di verifikasi!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function updateAccountPassword(email, password, is_admin = false) {
    let res, clientref;
    const table_name = getTableName(is_admin);

    await db.connect().then(async (client) => {
        clientref = client;
        try {
            await client.query('BEGIN');
            await client.query(
                `UPDATE ${table_name} SET password = $1 WHERE email = $2`,
                [password, email]
            );
            await client.query(
                'DELETE FROM account_otps WHERE email = $1 AND is_admin = $2;',
                [email, is_admin]
            );
            await client.query('COMMIT');
        }
        catch (err) {
            logger.error({ err }, 'Terjadi error database di modul verifikasi!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        } finally {
            clientref.release();
        }
    });

    return true;
}

async function setAccountVerified(email, is_admin = false) {
    let res, clientref;
    const table_name = getTableName(is_admin);


    await db.connect().then(async (client) => {
        clientref = client;
        try {
            await client.query('BEGIN');
            await client.query(
                `UPDATE ${table_name} SET verified = $1 WHERE email = $2`,
                [true, email]
            );
            await client.query(
                'DELETE FROM account_otps WHERE email = $1 AND is_admin = $2;',
                [email, is_admin]
            );
            await client.query('COMMIT');
        }
        catch (err) {
            logger.error({ err }, 'Terjadi error database di modul verifikasi!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        } finally {
            clientref.release();
        }
    });

    return true;
}

module.exports = {
    saveOTP,
    findOTP,
    deleteOTP,
    incrementAttemptsCount,
    updateAccountPassword,
    setAccountVerified,
}