const repository = require('./repository');
const config = require('../../../../core/config');
const {logger} = require('../../../../core/logger');
const {parse} = require('uuid');
const {hashOpaqueString, compareOpaqueStringHash} = require('../../../../utils/password')
const {generateRefreshToken} = require('../../../../utils/token')
const {errors, errorResponder} = require('../../../../core/errors')

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

async function clearOneRefreshToken(token_id, account_id, is_admin) {
    const result = await repository.deleteRefreshToken(token_id, account_id, is_admin);
    console.log(result);

    if (result) return true;
}

async function clearRefreshTokens(account_id, is_admin) {
    const result = await repository.deleteRefreshTokens(account_id, is_admin);

    if (result) return true;
}

async function getRefreshToken(token_id, account_id, is_admin) {
    const result = await repository.findRefreshToken(token_id, account_id, is_admin);

    // jika ditemukan key yang cocok
    if (result.rows.length > 0) return result.rows[0];
    else return false;
}

// returns uuid.opaqueStr
async function createRefreshToken(account_id = "", is_admin) {
    const refreshToken = await generateRefreshToken();

    // gunakan sha512 udah cukup, bcrypt khusus password
    const tokenHash = await hashOpaqueString(refreshToken);

    if (!tokenHash) return;

    const result = await repository.addRefreshToken(tokenHash, account_id, is_admin);
    let tokenId;

    if (!result) return;

    tokenId = result.rows[0].id;

    // send id as unique identifier (fast lookup) and unhashed opaque string, delimiter is . 
    const refreshTokenStr = `${tokenId}.${refreshToken}`
    console.log(refreshTokenStr);

    return refreshTokenStr;
}

async function verifyRefreshToken(id = "", token = "", account_id = "", is_admin) {
    // const dbToken = await getRefreshToken('used-id', account_id, is_admin); // test refresh token reuse
    const dbToken = await getRefreshToken(id, account_id, is_admin);

    // refresh token tidak ada
    if (!dbToken) throw errorResponder(errors.UNAUTHORIZED)

    // kasus refresh token sudah pernah dipakai sekali
    if (dbToken.is_revoked) {
        // hapus semua refresh token yg dimiliku sebuah akun
        await clearRefreshTokens(account_id, is_admin);
        throw errorResponder(errors.SECURITY, "Terdeteksi aktivitas mencurigakan! Melakukan logout dari semua sesi...")
    }

    // timestamptz to js unix time
    const expiredTime = new Date(dbToken.expires_at).getTime()
    if (dbToken.expires_at < Date.now()) {
        await clearOneRefreshToken(id, account_id, is_admin)
        throw errorResponder(errors.UNAUTHORIZED);
    }

    console.log(token)
    console.log(dbToken.token);
    const matched = await compareOpaqueStringHash(token, dbToken.token)
    if (!matched) throw errorResponder(errors.INVALID_TOKEN, "Token tidak sesuai!");    
    else {
        // set revoked, karena refresh token sekali pakai 
        // (issue http cookie refresh_token baru di masing2 controller)
        await repository.setRefreshTokenRevoked(id, account_id, is_admin);
        return true;
    }
}


module.exports = {
    invalidateJti,
    isInvalidJti,
    createRefreshToken,
    clearRefreshTokens,
    clearOneRefreshToken,
    getRefreshToken,
    verifyRefreshToken
}   