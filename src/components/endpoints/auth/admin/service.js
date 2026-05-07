const repository = require('./repository');
const { parseAdminId } = require('../../../../utils/id-parser');
const jwt = require('jsonwebtoken');
const config = require('../../../../core/config');
const { refreshAdminJwt } = require('../../../../utils/token')

async function findByEmail(email) {
    const res = await repository.findByEmail(email);

    return res.rows[0];
}

async function findById(admin_id) {
    const res = await repository.findById(admin_id);

    return res.rows[0];
}

async function createAdmin(admin) {
    const { email, passwordHash } = admin;

    const res = await repository.createAdmin(email, passwordHash);

    return res;
}

async function createRefreshToken(accessToken) {
    // refresh dilakukan 5 menit sebelum expired
    let payload;
    await jwt.verify(accessToken, config.secret.admin, (err, decoded) => {
        if (err) {
            logger.error({err}, "Terjadi error saat validasi token refresh!");
            if (err.name = 'TokenExpiredError') throw errorResponder(errors.TOKEN_EXPIRED, "Token sudah expired!");
            else throw errorResponder(errors.INVALID_TOKEN, "Token yang diberikan tidak valid!");
        }

        payload = decoded;
    });

    const data = await repository.findById(parseAdminId(payload.admin_id));
    const admin = data.rows[0];

    if (!admin) throw errorResponder(errors.NOT_FOUND, "Admin tidak ditemukan!");

    const refreshToken = await refreshAdminJwt(admin);

    if (!refreshToken) throw errorResponder(errors.INVALID_TOKEN, "Gagal membuat token baru!");

    return refreshToken;
}

module.exports = {
    findByEmail,
    findById,
    createAdmin,
    createRefreshToken,
}