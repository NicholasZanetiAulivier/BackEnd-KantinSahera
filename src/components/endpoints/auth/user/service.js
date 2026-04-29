const { changeUsername } = require('./controller');
const repository = require('./repository');

async function findByEmail(email) {
    const res = await repository.findByEmail(email);

    return res.rows[0];
}

async function createUser(user) {
    const { username, email, passwordHash } = user;

    const res = await repository.createUser(username, email, passwordHash);

    return res;
}

async function changeUsernameWhereEmail(user) {
    const {username, email} = user;

    const res = await repository.changeUsernameWhereEmail(username, email);

    return res;
}

module.exports = {
    findByEmail,
    createUser,
    changeUsernameWhereEmail,
}