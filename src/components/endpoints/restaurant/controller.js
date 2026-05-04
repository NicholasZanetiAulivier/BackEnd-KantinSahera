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


module.exports = {
    getRestaurantData
}