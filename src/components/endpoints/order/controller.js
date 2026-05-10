const { errorResponder, errors, processJoiValidationError } = require('../../../core/errors');
const service = require('./service');
const validate = require('../../middlewares/validator');
const { parseUserId } = require('../../../utils/id-parser');
const { checkInteger } = require('../../../utils/checks');

async function getCustomerCart(req, res, next) {
    try {
        const id = parseUserId(req.user.user_id);
        const id_params = req.params.id;

        if (!(id === id_params)) {
            throw errorResponder(errors.INVALID_CREDENTIALS, "User tidak memiliki hak akses untuk cart yang diminta!");
        }

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
        const id = parseUserId(req.user.user_id);
        const id_params = req.params.id;

        if (!(id === id_params)) {
            throw errorResponder(errors.INVALID_CREDENTIALS, "User tidak memiliki hak akses untuk cart yang diminta!");
        }

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


module.exports = {
    getCustomerCart,
    addCustomerCartItem
}