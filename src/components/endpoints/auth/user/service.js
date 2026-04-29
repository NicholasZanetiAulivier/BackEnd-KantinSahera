const repository = require('./repository');

async function emailExists(email) {
    const res = await repository.findEmail(email);

    return res.rows[0];
}

async function createUser(user) {
    const { username, email, passwordHash } = user;

    const res = await repository.createUser(username, email, passwordHash);

    return res;
}

module.exports = {
    emailExists,
    createUser,
}