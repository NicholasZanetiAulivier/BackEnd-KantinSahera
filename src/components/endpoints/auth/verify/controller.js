const { errorResponder, errors, processJoiValidationError } = require('../../../../core/errors');
const validate = require('../../../middlewares/validator')
const service = require('./service');

async function verifyOTP(req, res, next) {
    try {
        const { email, otp_code } = req.body;

        const { error, value } = validate.verifyOtp({ email, otp_code });

        processJoiValidationError(error);

        const result = await service.verifyOTP(email, otp_code);

        if (result) return res.status(204).end();
    } catch (err) {
        return next(err);
    }
}

async function requestOTP(req, res, next) {
    try {
        const { email } = req.body

        const { error, value } = validate.email(email);

        processJoiValidationError(error);

        const result = await service.sendOTP(email);

        if (result) return res.status(204).end();
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    verifyOTP,
    requestOTP,
}