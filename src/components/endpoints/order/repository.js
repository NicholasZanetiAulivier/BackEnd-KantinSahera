const { errorResponder, errors } = require('../../../core/errors');
const db = require('../../../database/db');
const { logger } = require('../../../core/logger');

async function getCustomerCart(id, offset, limit) {
    let res, clientref;
    let offsetLimitString = "";
    let add = [id];
    let c = 2;
    if (limit) {
        offsetLimitString += " LIMIT $" + c++;
        add.push(limit);
    }
    if (offset) {
        offsetLimitString += " OFFSET $" + c++;
        add.push(offset);
    }

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "SELECT quantity, carts.menu_id , name , image_url, price, is_available FROM carts JOIN menus ON carts.menu_id=menus.menu_id WHERE carts.customer_id= $1" + offsetLimitString,
            add
        ).then(result => {
            res = result
        });
    }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

async function addCustomerCartItem(id, menu_id, quantity) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "INSERT INTO carts(customer_id , menu_id , quantity) VALUES ($1,$2,$3)",
            [id, menu_id, quantity]
        ).then(result => {
            res = result
        });
    }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

async function getItemInCustomerCart(id, menu_id) {
    let res, clientref;

    await db.connect().then(async (client) => {
        clientref = client;
        await client.query(
            "SELECT * FROM carts WHERE customer_id = $1 AND menu_id = $2",
            [id, menu_id]
        ).then(result => {
            res = result
        });
    }).catch((err) => {
        logger.error({ err }, 'Terjadi error database di restaurant!');
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Error nice GODJOB");
    }).finally(async () => {
        await clientref.release();
    });
    return res;
}

module.exports = {
    getCustomerCart,
    addCustomerCartItem,
    getItemInCustomerCart
}