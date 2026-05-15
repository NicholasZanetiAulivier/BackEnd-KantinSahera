const repository = require('./repository');
const adminPassport = require('../../middlewares/authentication');
const { errorResponder, errors } = require('../../../core/errors');

async function getCustomerCart(id, offset, limit) {
    const result = await repository.getCustomerCart(id, offset, limit);
    return result.rows;
}

async function checkItemInCustomerCart(id, menu_id) {
    const result = await repository.getItemInCustomerCart(id, menu_id);
    return result.rowCount > 0;
}

async function checkCustomerCartExists(id) {
    const result = await repository.getCustomerCart(id, null, null);
    return result.rows.length > 0; // ini error jg
}

async function addCustomerCartItem(id, menu_id, quantity) {
    const result = await repository.addCustomerCartItem(id, menu_id, quantity);
    return result.rows;
}

async function updateCustomerCartItem(id, menu_id, quantity) {
    const result = await repository.updateCustomerCartItem(id, menu_id, quantity);
    return result.rows;
}

async function deleteCustomerCartItem(id, menu_id) {
    const result = await repository.deleteCustomerCartItem(id, menu_id);
    return result.rows;
}

async function deleteCustomerCart(id) {
    const result = await repository.deleteCustomerCart(id);
    return result.rows;
}

async function getCartPrice(id, has_fee) {
    const price = await repository.getCartPrice(id, has_fee); //WE HAVE TO CHANGE THIS, CHECK FROM POSSIBLE LOCATIONS
    return price;
}

async function createOrder(id, location, note, has_fee, is_takeaway) {
    const result = await repository.createOrder(id, location, note, has_fee, is_takeaway);

    return result;
}

async function getOrderByID(id) {
    const result = await repository.getOrderByID(id);
    return result.rows[0];
}

async function getOrderByUserID(id, offset, limit) {
    const result = await repository.getOrderByUserID(id, offset, limit);
    return result.rows;
}

async function getOrders(offset, limit) {
    const result = await repository.getOrders(offset, limit);
    return result.rows;

}


module.exports = {
    getCustomerCart,
    getCartPrice,
    checkItemInCustomerCart,
    checkCustomerCartExists,
    addCustomerCartItem,
    updateCustomerCartItem,
    deleteCustomerCartItem,
    deleteCustomerCart,
    createOrder,
    getOrderByID,
    getOrderByUserID,
    getOrders
}