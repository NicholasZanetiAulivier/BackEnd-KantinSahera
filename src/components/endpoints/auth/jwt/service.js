const repository = require('./repository');
const config = require('../../../../core/config');
const {logger} = require('../../../../core/logger');

// i dont want to use redis, why?
// pertama, gw gk mau bikin ram deployment MELEDAK (redis itu in memory)
// kedua, ribetin harus setup lagi
async function invalidateJti(exp, jti) {
    const result = await repository.addInvalid(exp, jti);

    if (result) return true;
}

async function isInvalidJti(jti) {
    const found = await repository.findJti(jti);

    if (found.rows.length > 0) return true;
}

module.exports = {
    invalidateJti,
    isInvalidJti,
}