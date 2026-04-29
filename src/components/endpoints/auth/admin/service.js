const repository = require('./repository');

async function findByEmail(email) {
    const res = await repository.findByEmail(email);

    return res.rows[0];
}

async function createAdmin(admin) {
    const { email, passwordHash } = admin;

    const res = await repository.createAdmin(email, passwordHash);

    return res;
}

module.exports = {
    findByEmail,
    createAdmin,
}