const repository = require('./repository');
const config = require('../../../../core/config');
const {logger} = require('../../../../core/logger');
const {parse} = require('uuid');

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

async function addRefreshToken(token, account_id, is_admin) {
    const parsedId = parse(account_id);
    const result = await repository.addRefreshToken(token, parsedId, is_admin);

    if (result) return true;
}

async function clearRefreshToken(token, account_id, is_admin) {
    const parsedId = parse(account_id);
    const result = await repository.deleteRefreshToken(token, parsedId, is_admin);

    if (result) return true;
}

async function getRefreshTokens(account_id, is_admin) {
    const parsedId = parse(account_id);
    const result = await repository.findRefreshTokens(parsedId, is_admin);

    if (result.rows.length > 0) return true;
}


module.exports = {
    invalidateJti,
    isInvalidJti,
    addRefreshToken,
    clearRefreshToken,
    getRefreshTokens
}   