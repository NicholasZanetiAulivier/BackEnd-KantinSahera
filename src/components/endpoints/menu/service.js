const repository = require('./repository');
const adminPassport = require('../../middlewares/authentication');

async function createMenu(name, image_url, price) {
    const res = await repository.createMenu(name, image_url, price);

    return res.rows[0];
}

async function editMenu(id, data) {
    const res = await repository.editMenu(id, data);

    return;
}

module.exports = {
    createMenu,
    editMenu,
}