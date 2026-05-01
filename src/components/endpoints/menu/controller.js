const { errorResponder, errors, processJoiValidationError } = require('../../../core/errors');
const service = require('./service');
const validate = require('../../middlewares/validator');

async function createMenu(req, res, next) {
    try {

        const { error, value } = validate.menu(req.body);
        const { name, image_url, price } = value;

        processJoiValidationError(error);

        const result = await service.createMenu(name, image_url || undefined, price);
        return res.status(201).json({ message: "Menu berhasil dibuat!", data: result }).send();
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    createMenu,
}