const repository = require('./repository');

async function emailExists(email) {
    const res = await repository.findEmail(email);

    if (Array.isArray(res.rows) && res.rows.length === 0) {
        return false;
    } else {
        return true;
    }
}

async function createUser(user) {
    const res = await repository.createUser(user);

    return res.rows[0];
}

module.exports = {
    generateJwt,
    refreshJwt,
    emailExists,
    createUser,
}