const { errorResponder, errors } = require('../../../../core/errors');
const db = require('../../../../database/db');

async function saveOTP(email, otp) {
    let res, clientref;

    // kasih 15 menit
    const expires_at = new Date(Date.now() + 15 * 60 * 1000);

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            `INSERT INTO account_otps (email, otp, expires_at)
                VALUES ($1, $2, $3)
                ON CONFLICT (email) DO UPDATE
                SET otp = $2, expires_at = $3
            `,
            [email, otp, expires_at]
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

async function findOTP(email) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'SELECT * FROM account_otps WHERE email = $1',
            [email]
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

async function deleteOTP(email) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'DELETE FROM account_otps WHERE email = $1;',
            [email]
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

async function markAsVerified(email) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        // ini otomatis gk boleh ada email sama di dua tabel, email harus di satu tabel aj
        try{

            await client.query('BEGIN');
            await client.query(
                `UPDATE users SET verified = TRUE WHERE email = $1
                    AND NOT EXISTS(
                        SELECT 1 FROM admins
                        WHERE email = $1
                    )`, [email]
            );

            await client.query(
                `UPDATE admins SET verified = TRUE WHERE email = $1
                    AND NOT EXISTS(
                        SELECT 1 FROM users
                        WHERE email = $1
                    )`, [email]
            );

            await client.query(
                'DELETE FROM account_otps WHERE email = $1;',
                [email]
            );
            await client.query('COMMIT');
        }
        catch (err) {
            console.log(err);
            await client.query('ROLLBACK');
            throw errorResponder(errors.DB, "Error nice GODJOB");
        } finally {
            clientref.release();
        }
    });
                
    return true;
}

module.exports = {
    saveOTP,
    findOTP,
    markAsVerified,
    deleteOTP,
}