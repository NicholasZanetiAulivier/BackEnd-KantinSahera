const { errorResponder, errors } = require('../../../../core/errors');
const db = require('../../../../database/db');
const {logger} = require('../../../../core/logger');

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
            logger.error({err}, 'Terjadi error database di modul admin!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function findById(admin_id) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'SELECT admin_id, email, super_admin, verified FROM admins WHERE admin_id = $1',
            [admin_id]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({err}, 'Terjadi error database di modul admin!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function getAllAdmins() {
    let res, clientref;
 
    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            'SELECT admin_id, email, super_admin, verified FROM admins ORDER BY super_admin DESC, email ASC'
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({err}, 'Terjadi error database di modul admin!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });
    return res;
}

async function updateAdmin(admin_id, email) {
    let res, clientref;

    const sets = [];
    const values = [];
    let c = 1;
    if (email !== undefined) {
        sets.push(`email = $${c++}`);
        values.push(email);
    }
    if (sets.length === 0) return null;
    values.push(admin_id);
    await db.connect().then(async (client) => {
        clientref = client;
        
        await client.query(
            `UPDATE admins SET ${sets.join(', ')} WHERE admin_id = $${c} RETURNING admin_id, email, super_admin, verified`,
            values
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({err}, 'Terjadi error database di modul admin!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
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
            logger.error({err}, 'Terjadi error database di modul admin!');
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
        }).finally(() => {
            clientref.release();
        });
    });

    return res;
}

async function deleteAdmin(admin_id) {
    let res, clientref;
 
    await db.connect().then(async (client) => {
        clientref = client;
 
        await client.query(
            'DELETE FROM admins WHERE admin_id = $1 AND super_admin = FALSE RETURNING admin_id',
            [admin_id]
        ).then(result => {
            res = result
        }).catch((err) => {
            logger.error({err}, 'Terjadi error database di modul admin!');
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
    getAllAdmins,
    updateAdmin,
    createAdmin,
    deleteAdmin
}