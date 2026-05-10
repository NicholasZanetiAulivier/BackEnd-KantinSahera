const { errorResponder, errors } = require('../core/errors');
const { parseUserId } = require('./id-parser')

function checkInteger(i, minVal, name) {
    if (Number.isNaN(i))
        throw errorResponder(errors.BAD_ID, "ID tidak dapat diproses");
    if (i < minVal)
        throw errorResponder(errors.BAD_ID, "ID harus berupa angka positif >= " + minVal + i);
    if (Number.isInteger(i))
        throw errorResponder(errors.BAD_ID, "ID harus berupa angka bulat");
}

function checkUserParamsTokenID(req) {
    const id = parseUserId(req.user.user_id);
    const id_params = req.params.id;

    if (!(id === id_params)) {
        throw errorResponder(errors.INVALID_CREDENTIALS, "User tidak memiliki hak akses untuk cart yang diminta!");
    }
    return id;
}

module.exports = { checkInteger, checkUserParamsTokenID };