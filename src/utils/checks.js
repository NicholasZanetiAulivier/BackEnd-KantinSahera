const { errorResponder, errors } = require('../core/errors');

function checkInteger(i, minVal, name) {
    if (Number.isNaN(i))
        throw errorResponder(errors.BAD_ID, "ID tidak dapat diproses");
    if (i < minVal)
        throw errorResponder(errors.BAD_ID, "ID harus berupa angka positif >= " + minVal + i);
    if (Number.isInteger(i))
        throw errorResponder(errors.BAD_ID, "ID harus berupa angka bulat");
}

module.exports = { checkInteger };