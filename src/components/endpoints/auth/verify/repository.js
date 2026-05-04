const { errorResponder, errors } = require('../../../../core/errors');
const db = require('../../../../database/db');
const logger = require('../../../../core/logger')('verify-repository');
const config = require('../../../../core/config');

async function saveOTP(email, account_id, otp) {
    let res, clientref;

    // kasih 10 menit
    const expires_at = new Date(Date.now() + config.otp_time * 60 * 1000);
    const attempt_count = 1; // percobaan input otp

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `INSERT INTO account_otps (email, account_id, otp, expires_at, attempt_count)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (email, account_id) DO UPDATE
                SET otp = $2, created_at = NOW(), expires_at = $4, attempt_count = $5
            `,
            [email, account_id, otp, expires_at, attempt_count]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({err}, 'Terjadi error database di verifikasi!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function findOTP(email, account_id) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'SELECT * FROM account_otps WHERE email = $1 AND account_id = $2',
            [email, account_id]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({err}, 'Terjadi error database di verifikasi!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function deleteOTP(email, account_id) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'DELETE FROM account_otps WHERE email = $1 AND account_id = $2;',
            [email, account_id]
        ).then(result => {
            res = result
        }).catch((err) => {
            console.log(err);
            logger.error({err}, 'Terjadi error database di verifikasi!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function setAdminVerified(email, admin_id) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        try{
            await client.query('BEGIN');
            await client.query(
                `UPDATE admins SET verified = TRUE WHERE email = $1 AND admin_id = $2`, 
                [email, admin_id]
            );
            await client.query(
                'DELETE FROM account_otps WHERE email = $1 AND account_id = $2;',
                [email, admin_id]
            );
            await client.query('COMMIT');
        }
        catch (err) {
            await client.query('ROLLBACK');
            logger.error({err}, 'Terjadi error database di verifikasi!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        } finally {
            clientref.release();
        }
    });
                
    return true;
}

async function setUserVerified(email, user_id) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        try{
            await client.query('BEGIN');
            await client.query(
                `UPDATE users SET verified = TRUE WHERE email = $1 AND user_id = $2`, 
                [email, user_id]
            );
            await client.query(
                'DELETE FROM account_otps WHERE email = $1 AND account_id = $2;',
                [email, user_id]
            );
            await client.query('COMMIT');
        }
        catch (err) {
            logger.error({err}, 'Terjadi error database di modul verifikasi!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        } finally {
            clientref.release();
        }
    });
                
    return true;
}

async function incrementAttemptsCount(email, account_id) {
        let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `UPDATE account_otps SET attempt_count = attempt_count + 1 
                WHERE email = $1 AND account_id = $2`,
            [email, account_id]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({err}, 'Terjadi error database di verifikasi!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function updateUserPassword(email, user_id, password) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        try{
            await client.query('BEGIN');
            await client.query(
                `UPDATE users SET password = $1
                    WHERE email = $2 AND user_id = $3`,
                [password, email, user_id]
            );
            await client.query(
                'DELETE FROM account_otps WHERE email = $1 AND account_id = $2;',
                [email, user_id]
            );
            await client.query('COMMIT');
        }
        catch (err) {
            logger.error({err}, 'Terjadi error database di modul verifikasi!');
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
    setAdminVerified,
    setUserVerified,
    deleteOTP,
    incrementAttemptsCount,
    updateUserPassword,
}