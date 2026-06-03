const repository = require('./repository');
const { parseAdminId } = require('../../../../utils/id-parser');
const jwt = require('jsonwebtoken');
const config = require('../../../../core/config');
const { refreshAdminJwt } = require('../../../../utils/token')
const tokenService = require('../token/service')
const {logger} = require('../../../../core/logger');
const {errors, errorResponder} = require('../../../../core/errors')

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

async function getAllAdmins() {
 
    const res = await repository.getAllAdmins();
 
    return res.rows;
 
}

async function updateAdmin(admin_id, email) {
 
    const res = await repository.updateAdmin(admin_id, email);
 
    return res;
 
}

async function deleteAdmin(admin_id) {
 
    const res = await repository.deleteAdmin(admin_id);
 
    return res;
 
}

async function refreshAccessToken(accessToken, refreshToken) {
    let payload;
    jwt.verify(accessToken, config.secret.admin, (err, decoded) => {
        if (err) {
            // bolehkan jwt yg expired, karena tujuan kita generate access token baru (jwt baru)
            if (err.name === 'TokenExpiredError') {
                payload = jwt.decode(accessToken);
            }
            else {
                logger.error({err}, "Terjadi error saat validasi token refresh!");
                throw errorResponder(errors.UNAUTHORIZED, "Token yang diberikan tidak valid!");
            } 
        }

        payload = decoded;
    });

    const splittedRefreshToken = refreshToken.split('.');
    const refreshId = splittedRefreshToken[0];
    const opaqueStr = splittedRefreshToken[1];

    const payloadAdminId = parseAdminId(payload.admin_id);
    const data = await repository.findById(payloadAdminId);
    const admin = data.rows[0];

    if (!admin) throw errorResponder(errors.NOT_FOUND, "User tidak ditemukan!");

    await tokenService.verifyRefreshToken(refreshId, opaqueStr, admin.admin_id, true);

    const newAccessToken = await generateUserJwt(admin);

    if (!newAccessToken) throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Terjadi error pada saat proses refresh token!");

    return {
        accessToken: newAccessToken,
        adminId: admin.user_id,
    };
}

function decodeAdminPayload(accessToken) {
    let payload;
    jwt.verify(accessToken, config.secret.admin, (err, decoded) => {
        if (err) {
            // bolehkan jwt yg expired, karena tujuan kita generate access token baru (jwt baru)
            if (err.name === 'TokenExpiredError') {
                payload = jwt.decode(accessToken);
            }
            else {
                logger.error({err}, "Terjadi error saat validasi token refresh!");
                throw errorResponder(errors.UNAUTHORIZED, "Token yang diberikan tidak valid!");
            } 
        }

        payload = decoded;
    });

    return payload;
}

module.exports = {
    findByEmail,
    findById,
    createAdmin,
    getAllAdmins,
    updateAdmin,
    deleteAdmin,
    refreshAccessToken,
    decodeAdminPayload,
}