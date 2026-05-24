const { errorResponder, errors, processJoiValidationError } = require('../../../core/errors');
const service = require('./service');
const validate = require('../../middlewares/validator');
const { checkInteger } = require('../../../utils/checks');

async function getMenu(req, res, next) {
    try {

        let { offset, limit, search, id } = req.query;

        if (offset) checkInteger(offset, 0, 'Offset');
        if (limit) checkInteger(limit, 0, 'Limit');
        let result;
        if (id) {
            id = id.trim().split(" ");
            for (let i of id) {
                checkInteger(i, 1, "ID");
            }
            result = await service.getMenuByIDs(id);
        } else {
            result = await service.getMenuBySearch(offset, limit, search);
        }
        return res.status(200).json({ data: result, offset, limit, count: await service.getMenuCount(search) });
    } catch (err) {
        return next(err);
    }
}
async function createMenu(req, res, next) {
    try {

        const { error, value } = validate.menu(req.body);

        processJoiValidationError(error);

        const { name, image_url, price } = value;

        const result = await service.createMenu(name, image_url || undefined, price);
        return res.status(201).json({ message: "Menu berhasil dibuat!", data: result });
    } catch (err) {
        return next(err);
    }
}

async function editMenu(req, res, next) {
    try {
        const { error, value } = validate.menuEdit(req.body);

        const id = new Number(req.params.id);
        checkInteger(id, 1, 'ID');

        processJoiValidationError(error);

        await service.editMenu(id, value);
        return res.status(204).end();
    } catch (err) {
        next(err);
    }
}

async function deleteMenu(req, res, next) {
    try {
        const id = new Number(req.params.id);

        checkInteger(id, 1, "ID");

        await service.deleteMenu(id);
        return res.status(204).end();
    } catch (err) {
        next(err);
    }
}


module.exports = {
    getMenu,
    createMenu,
    editMenu,
    deleteMenu
}