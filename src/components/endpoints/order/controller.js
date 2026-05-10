const { errorResponder, errors, processJoiValidationError } = require('../../../core/errors');
const service = require('./service');
const validate = require('../../middlewares/validator');
const { parseUserId } = require('../../../utils/id-parser');
const { checkInteger, checkUserParamsTokenID } = require('../../../utils/checks');

async function getCustomerCart(req, res, next) {
    try {
        const id = checkUserParamsTokenID(req);

        let { offset, limit } = req.query;

        if (offset) checkInteger(offset, 0, 'Offset');
        if (limit) checkInteger(limit, 0, 'Limit');

        const result = await service.getCustomerCart(id, offset, limit);
        return res.status(200).json({ items: result, offset: new Number(offset), limit: new Number(limit) }).send();
    } catch (err) {
        return next(err);
    }
}

async function addCustomerCartItem(req, res, next) {
    try {
        const id = checkUserParamsTokenID(req);

        const { error, value } = validate.cartItem(req.body);
        processJoiValidationError(error);

        const { menu_id, quantity } = value;

        if (await service.checkItemInCustomerCart(id, menu_id)) {
            throw errorResponder(errors.DB_DUPLICATE_CONFLICT, "Sudah ada item ini di dalam cart!, gunakan PUT untuk mengupdate!");
        }

        await service.addCustomerCartItem(id, menu_id, quantity);
        return res.status(204).send();
    } catch (err) {
        return next(err);
    }
}

async function updateCustomerCartItem(req, res, next) {
    try {
        const id = checkUserParamsTokenID(req);
        const { menuid: menu_id } = req.params;

        const { error, value } = validate.cartItemQuantity(req.body);
        processJoiValidationError(error);

        const { quantity } = value;

        if (!(await service.checkItemInCustomerCart(id, menu_id))) {
            throw errorResponder(errors.UNPROCESSABLE_ENTITY, "ID pengguna atau menu tidak valid! Pastikan pengguna sudah memiliki cart untuk menu ini sebelumnya!");
        }

        await service.updateCustomerCartItem(id, menu_id, quantity);
        return res.status(204).send();
    } catch (err) {
        return next(err);
    }
}

async function deleteCustomerCartItem(req, res, next) {
    try {
        const id = checkUserParamsTokenID(req);
        const { menuid: menu_id } = req.params;

        if (!(await service.checkItemInCustomerCart(id, menu_id))) {
            throw errorResponder(errors.UNPROCESSABLE_ENTITY, "ID pengguna atau menu tidak valid! Pastikan pengguna sudah memiliki cart untuk menu ini sebelumnya!");
        }

        await service.deleteCustomerCartItem(id, menu_id);
        return res.status(204).send();
    } catch (err) {
        return next(err);
    }
}


module.exports = {
    getCustomerCart,
    addCustomerCartItem,
    updateCustomerCartItem,
    deleteCustomerCartItem
}