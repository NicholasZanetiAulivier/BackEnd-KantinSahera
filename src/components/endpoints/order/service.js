const repository = require('./repository');
const adminPassport = require('../../middlewares/authentication');

async function getCustomerCart(id, offset, limit) {
    const result = await repository.getCustomerCart(id, offset, limit);
    return result.rows;
}

async function checkItemInCustomerCart(id, menu_id) {
    const result = await repository.getItemInCustomerCart(id, menu_id);
    return result.rowCount > 0;
}

async function addCustomerCartItem(id, menu_id, quantity) {
    const result = await repository.addCustomerCartItem(id, menu_id, quantity);
    return result.rows;
}


module.exports = {
    getCustomerCart,
    checkItemInCustomerCart,
    addCustomerCartItem
}