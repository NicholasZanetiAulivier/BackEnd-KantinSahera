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

async function changeProfileWhereEmail(user) {
    const {username, profile_image_url, phone_number, email} = user;

    const res = await repository.changeProfileWhereEmail({ username, profile_image_url, phone_no: phone_number }, email);

    return res;
}

module.exports = { 
    findByEmail,
    createUser,
    changeProfileWhereEmail,
}