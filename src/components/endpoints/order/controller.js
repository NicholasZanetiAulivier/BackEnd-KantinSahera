const { errorResponder, errors, processJoiValidationError } = require('../../../core/errors');
const service = require('./service');
const validate = require('../../middlewares/validator');
const { parseUserId } = require('../../../utils/id-parser');
const { checkInteger, checkUserParamsTokenID } = require('../../../utils/checks');
const restaurantService = require('../restaurant/service');

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
            throw errorResponder(errors.DB_DUPLICATE_CONFLICT, "Sudah ada item ini di dalam cart!, gunakan PUT untuk mengupdate!");
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

        const price = await service.getCartPrice(id, true);
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

        let { location, note } = value;

        let is_takeaway = false;
        if (location) is_takeaway = true;

        else location = null;

        note = note || null;

        const restaurantStatus = await restaurantService.getRestaurantStatus();
        if (restaurantStatus.status === "close") {
            throw errorResponder(errors.SERVICE_UNAVAILABLE, "Restoran sedang tutup, tidak bisa melakukan pemesanan!");
        }

        const exists = await service.checkCustomerCartExists(id);
        console.log(exists);
        if (!exists) {
            throw errorResponder(errors.NOT_FOUND, "Tidak ada data cart untuk pengguna ini!");
        }

        const result = await service.createOrder(id, location, note, true, is_takeaway); //CHANGE THIS FOR FEE IMPLEMENTATION
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

        if (!req.user.admin_id) {
            checkUserParamsTokenID(req);
        }

        if (offset) checkInteger(offset, 0, 'Offset');
        if (limit) checkInteger(limit, 0, 'Limit');

        const result = await service.getOrderByUserID(id, offset, limit);
        return res.status(200).json({ orders: result });
    } catch (err) {
        return next(err);
    }
}

async function getOrders(req, res, next) {
    try {

        const { offset, limit } = req.query;

        if (offset) checkInteger(offset, 0, 'Offset');
        if (limit) checkInteger(limit, 0, 'Limit');

        const result = await service.getOrders(offset, limit);
        return res.status(200).json({ orders: result });
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
    getOrders
}