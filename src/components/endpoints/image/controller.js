const service = require('./service')

async function createSignature(req, res, next) {
    try {
        const paramsToSign = req.body
        const sign = await service.generateCloudinarySignature(paramsToSign);

        if (sign) return res.status(200).json(sign);
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    createSignature
}