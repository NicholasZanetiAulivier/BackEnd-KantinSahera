const { errorResponder, errors, processJoiValidationError } = require('../../../core/errors');
const service = require('./service');
const validate = require('../../middlewares/validator');

async function getRestaurantData(req, res, next) {
    try {
        const data = await service.getRestaurantData();
        return res.status(200).json(data).send();
    } catch (err) {
        return next(err);
    }
}

async function getRestaurantStatus(req, res, next) {
    try {
        const data = await service.getRestaurantStatus();
        return res.status(200).json({ status: data }).send();
    } catch (err) {
        return next(err);
    }
}

async function setRestaurantStatus(req, res, next) {
    try {
        const status = req.params.status.toLowerCase().trim();
        if (status === 'open' || status === 'closed') {
            await service.setStatus(status);
        } else {
            throw errorResponder(errors.UNPROCESSABLE_ENTITY, `Status harus berupa "open" atau "closed"`);
        }
        return res.status(204).send();
    } catch (err) {
        return next(err);
    }
}

async function updateRestaurantData(req, res, next) {
    try {
        const { error, value } = validate.restaurant(req.body);
        processJoiValidationError(error);

        const { schedule, contacts, physical_place, address, status } = value;
        await service.updateOrSkip(schedule, contacts, physical_place, address, status);

        return res.status(204).send();
    } catch (err) {
        return next(err);
    }
}


module.exports = {
    getRestaurantData,
    getRestaurantStatus,
    setRestaurantStatus,
    updateRestaurantData
}