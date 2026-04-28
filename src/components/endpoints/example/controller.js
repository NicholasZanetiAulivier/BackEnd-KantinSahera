const { errorResponder, errors } = require('../../../core/errors');
const service = require('./service');

async function hello(req, res, next) {
    try {
        const { error } = req.query;

        if (error) {
            throw errorResponder(errors.INVALID_ARGUMENT, "Nice job throwing error");
        }

        const results = await service.getVersion();

        return res.status(200).json({ version: results[0] });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    hello,
}