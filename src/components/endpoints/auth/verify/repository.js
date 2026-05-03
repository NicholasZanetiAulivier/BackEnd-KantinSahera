const { errorResponder, errors } = require('../../../../core/errors');
const db = require('../../../../database/db');
const logger = require('../../../../core/logger')('verify-repository');

async function saveOTP(email, account_id, otp, is_reset_password) {
    let res, clientref;

    // kasih 15 menit
    const expires_at = new Date(Date.now() + 15 * 60 * 1000);

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `INSERT INTO account_otps (email, account_id, otp, is_reset_password, expires_at)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (email, account_id) DO UPDATE
                SET otp = $2, created_at = NOW(), expires_at = $5
            `,
            [email, account_id, otp, is_reset_password, expires_at]
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

async function setAdminVerified(email, account_id) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        try{
            await client.query('BEGIN');
            await client.query(
                `UPDATE admins SET verified = TRUE WHERE email = $1`, 
                [email]
            );
            await client.query(
                'DELETE FROM account_otps WHERE email = $1 AND account_id = $2;',
                [email, account_id]
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

async function setUserVerified(email, account_id) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        try{
            await client.query('BEGIN');
            await client.query(
                `UPDATE users SET verified = TRUE WHERE email = $1`, 
                [email]
            );
            await client.query(
                'DELETE FROM account_otps WHERE email = $1 AND account_id = $2;',
                [email, account_id]
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
}