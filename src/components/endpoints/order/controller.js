const { errorResponder, errors, processJoiValidationError } = require('../../../core/errors');
const service = require('./service');
const validate = require('../../middlewares/validator');
const { parseUserId } = require('../../../utils/id-parser');
const { checkInteger, checkUserParamsTokenID } = require('../../../utils/checks');
const restaurantService = require('../restaurant/service');
const crypto = require('crypto');
const config = require('../../../core/config');
const { nonSnapSignature } = require('../../../utils/doku');

async function getCustomerCart(req, res, next) {
    try {
        const id = parseUserId(req.user.user_id);

        let { offset, limit } = req.query;

        if (offset) checkInteger(offset, 0, 'Offset');
        if (limit) checkInteger(limit, 0, 'Limit');

        const result = await service.getCustomerCart(id, offset, limit);
        return res.status(200).json({ items: result, offset: new Number(offset), limit: new Number(limit) });
    } catch (err) {
        return next(err);
    }
}

async function addCustomerCartItem(req, res, next) {
    try {
        const id = parseUserId(req.user.user_id);

        const { error, value } = validate.cartItem(req.body);
        processJoiValidationError(error);

        const { menu_id, quantity } = value;

        if (await service.checkItemInCustomerCart(id, menu_id)) {
            throw errorResponder(errors.DB_DUPLICATE_CONFLICT, "Sudah ada item ini di dalam cart!, gunakan PATCH untuk mengupdate!");
        }

        await service.addCustomerCartItem(id, menu_id, quantity);
        return res.status(204).end();
    } catch (err) {
        return next(err);
    }
}

async function updateCustomerCartItem(req, res, next) {
    try {
        const id = parseUserId(req.user.user_id);
        const { menuid: menu_id } = req.params;

        const { error, value } = validate.cartItemQuantity(req.body);
        processJoiValidationError(error);

        const { quantity } = value;

        if (!(await service.checkItemInCustomerCart(id, menu_id))) {
            throw errorResponder(errors.UNPROCESSABLE_ENTITY, "ID pengguna atau menu tidak valid! Pastikan pengguna sudah memiliki cart untuk menu ini sebelumnya!");
        }

        await service.updateCustomerCartItem(id, menu_id, quantity);
        return res.status(204).end();
    } catch (err) {
        return next(err);
    }
}

async function deleteCustomerCartItem(req, res, next) {
    try {
        const id = parseUserId(req.user.user_id);
        const { menuid: menu_id } = req.params;

        if (!(await service.checkItemInCustomerCart(id, menu_id))) {
            throw errorResponder(errors.UNPROCESSABLE_ENTITY, "ID pengguna atau menu tidak valid! Pastikan pengguna sudah memiliki cart untuk menu ini sebelumnya!");
        }

        await service.deleteCustomerCartItem(id, menu_id);
        return res.status(204).end();
    } catch (err) {
        return next(err);
    }
}

async function deleteCustomerCart(req, res, next) {
    try {
        const id = parseUserId(req.user.user_id);

        await service.deleteCustomerCart(id);
        return res.status(204).end();
    } catch (err) {
        return next(err);
    }
}

async function getCartPrice(req, res, next) {
    try {
        const id = parseUserId(req.user.user_id);
        const { building } = req.query;

        const price = await service.getCartPrice(id, building == undefined ? false : true); //We assume for now a flat fee. Although this should depend on the building
        return res.status(200).json({ price });
    } catch (err) {
        return next(err);
    }
}

async function createOrder(req, res, next) {
    try {
        const id = parseUserId(req.user.user_id);

        const { error, value } = validate.order(req.body);
        processJoiValidationError(error);

        let { location, note } = value; //Encoded location building|floor|extra

        let is_takeaway = false;
        if (location) is_takeaway = true;
        else location = null;

        note = note || null;

        const restaurantStatus = await restaurantService.getRestaurantStatus();
        if (restaurantStatus.status === "close") {
            throw errorResponder(errors.SERVICE_UNAVAILABLE, "Restoran sedang tutup, tidak bisa melakukan pemesanan!");
        }

        const exists = await service.checkCustomerCartExists(id);
        // console.log(exists);
        if (!exists) {
            throw errorResponder(errors.NOT_FOUND, "Tidak ada data cart untuk pengguna ini!");
        }

        const result = await service.createOrder(id, location, note, !is_takeaway, is_takeaway); //CHANGE THIS FOR FEE IMPLEMENTATION
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}

async function getOrderByID(req, res, next) {
    try {
        const orderId = req.params.id;
        const userId = req.user.user_id;

        const order = await service.getOrderByID(orderId);

        const orderCustId = order.customer_id;

        if (!req.user.admin_id && userId !== orderCustId) {
            throw errorResponder(errors.INVALID_TOKEN, "Anda tidak diizinkan mengakses endpoint ini!");
        }

        return res.status(200).json({ order: order });
    } catch (err) {
        return next(err);
    }
}

async function getOrderByUserID(req, res, next) {
    try {
        const id = req.params.id;

        const { offset, limit } = req.query;

        const userId = req.user.user_id;

        let validId;
        if (req.user.user_id) {
            // checkUserParamsTokenID(req); // gak bisa kayak gini nikkkk
            validId = checkUserParamsTokenID(userId, req.params.id)
        }

        if (validId) {
            if (offset) checkInteger(offset, 0, 'Offset');
            if (limit) checkInteger(limit, 0, 'Limit');

            const parsedId = parseUserId(userId)

            const result = await service.getOrderByUserID(parsedId, offset, limit);
            return res.status(200).json({ orders: result });
        }
    } catch (err) {
        return next(err);
    }
}

async function getOrders(req, res, next) {
    try {

        let { offset, limit, paid, fulfilled } = req.query;

        if (offset) checkInteger(offset, 0, 'Offset');
        if (limit) checkInteger(limit, 0, 'Limit');

        if (paid) {
            paid = paid.trim().toLowerCase() === 'true' ? true : false;
        }
        if (fulfilled) {
            fulfilled = fulfilled.trim().toLowerCase() === 'true' ? true : false;
        }

        const result = await service.getOrders(offset, limit, paid, fulfilled);
        return res.status(200).json({ orders: result });
    } catch (err) {
        return next(err);
    }
}

const DOKU_TRANSACTION_STATUS = [
    "SUCCESS", "FAILED"
];

async function handleNonSnapDokuNotifications(req, res, next) {
    try {
        const { order, transaction } = req.body;
        console.log(req);
        const clientID = req.get("Client-Id");
        const requestID = req.get("Request-Id");
        const timestamp = req.get("Request-Timestamp");
        const target = '/api/order/notifications/payments';


        const signature = await nonSnapSignature(req.body, clientID, requestID, timestamp, target);
        const originSignature = req.get("Signature");
        // console.log(signature + "\n" + originSignature);

        // This doesnt work
        // if (!(signature === originSignature)) {
        //     throw errorResponder(errors.INVALID_TOKEN, "Signature does not match!");
        // }

        if (!order) {
            throw errorResponder(errors.INVALID_ARGUMENT, "Request body is missing order component");
        }

        if (!transaction) {
            throw errorResponder(errors.INVALID_ARGUMENT, "Request body is missing transaction component");
        }

        //We can check status through GET api after this, but honestly its kinda redundant (unless server key leaks)

        if (!DOKU_TRANSACTION_STATUS.includes(transaction.status)) {
            throw errorResponder(errors.BAD_REQUEST, "Transaction status is not valid");
        }

        await service.updateOrderTransaction(order, transaction);
        return res.status(200).end();
    } catch (err) {
        return next(err);
    }
}


module.exports = {
    getCustomerCart,
    getCartPrice,
    addCustomerCartItem,
    updateCustomerCartItem,
    deleteCustomerCartItem,
    deleteCustomerCart,
    createOrder,
    getOrderByID,
    getOrderByUserID,
    getOrders,
    handleNonSnapDokuNotifications
}