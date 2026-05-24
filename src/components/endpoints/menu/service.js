const repository = require('./repository');
const adminPassport = require('../../middlewares/authentication');

async function getMenuByIDs(ids) {
    const res = await repository.getMenuByIDs(ids);

    return res.rows;
}
async function getMenuBySearch(offset, limit, search) {
    const res = await repository.getMenuBySearch(offset, limit, search);

    return res.rows;
}

async function getMenuCount(search) {
    const count = (await repository.getMenuCount(search)).rows[0]['count'];
    return count;
}

async function createMenu(name, image_url, price) {
    const res = await repository.createMenu(name, image_url, price);

    return res.rows[0];
}

async function editMenu(id, data) {
    const res = await repository.editMenu(id, data);

    return; // ???
    // return void === undefined
}

async function deleteMenu(id) {
    const res = await repository.deleteMenu(id);

    return;
}

module.exports = {
    getMenuByIDs,
    getMenuBySearch,
    getMenuCount,
    createMenu,
    editMenu,
    deleteMenu,
}