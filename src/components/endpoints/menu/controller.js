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

async function editMenu(req, res, next) {
    try {
        const { error, value } = validate.menuEdit(req.body);
        const id = new Number(req.params.id);


        if (Number.isNaN(id))
            throw errorResponder(errors.BAD_ID, "ID tidak dapat diproses");
        if (id < 1)
            throw errorResponder(errors.BAD_ID, "ID harus berupa angka positif > 1");
        if (Number.isInteger(id))
            throw errorResponder(errors.BAD_ID, "ID harus berupa angka bulat");

        processJoiValidationError(error);

        await service.editMenu(id, value);
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}


module.exports = {
    createMenu,
    editMenu,
}