const { errorResponder, errors } = require('../../../../core/errors');
const db = require('../../../../database/db');

async function findByEmail(email) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'SELECT admin_id, email, password, super_admin, verified FROM admins WHERE email = $1',
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

async function createAdmin(email, passwordHash) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'INSERT INTO admins (email, password) VALUES ($1, $2 ) RETURNING email',
            [email, passwordHash]
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
    findByEmail,
    createAdmin,
}