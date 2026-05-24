const { errorResponder, errors } = require('../../../../core/errors');
const db = require('../../../../database/db');
const {logger} = require('../../../../core/logger');

async function findByEmail(email) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'SELECT user_id, google_id, profile_image_url, email, username, password, verified FROM users WHERE email = $1',
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

async function findById(user_id) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'SELECT user_id, google_id, email, profile_image_url, username, verified FROM users WHERE user_id = $1',
            [user_id]
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

// nambahin return kolom yang perlu (user_id dan verified), 
// jadi selain untuk return info profil juga bisa buat semacam /auth/me (biar gk ribet)
async function getProfileById(id) {
    let res, clientref
    await db.connect().then(async (client) => {
        clientref = client

        await client.query(
            `SELECT user_id, username, email, profile_image_url, phone_no, verified FROM users WHERE user_id = $1`,
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

async function createOrUpsertGoogleUser(googleUser) {
    const user = googleUser;
    
    const { google_id, username, email, profile_image_url } = user;

    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;

        // xmax untuk pengecekan on conflict dijalankan tidak
        // coalesce returns first non null, so existing config wont be overwritten by google payload
        // https://stackoverflow.com/questions/34762732/how-to-find-out-if-an-upsert-was-an-update-with-postgresql-9-5-upsert
        await client.query(
            `INSERT INTO users (google_id, username, email, profile_image_url, verified)
                VALUES ($1, $2, $3, $4, true) ON CONFLICT (email) DO UPDATE SET
                google_id = $1,
                username = COALESCE(users.username, $2),
                profile_image_url = COALESCE(users.profile_image_url, $4),
                verified = true
                RETURNING user_id, username, email, verified, (xmax::text::int > 0) AS is_updated
            `,
            [google_id, username, email, profile_image_url]
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
    findById,
    createUser,
    changeProfileWhereId,
    getProfileById,
    createOrUpsertGoogleUser,
}