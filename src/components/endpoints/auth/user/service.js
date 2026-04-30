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

async function changeProfileWhereId(user) {
    const {username, profile_image_url, phone_number, user_id} = user;

    const res = await repository.changeProfileWhereId({ username, profile_image_url, phone_no: phone_number }, user_id);

    return res;
}

async function getProfileById(id) {
    const res = await repository.getProfileById(id);

    return res.rows[0];
}

module.exports = { 
    findByEmail,
    createUser,
    changeProfileWhereId,
    getProfileById,
}