const jwt = require('jsonwebtoken');
const config = require('../core/config');
const { userPayload, adminPayload } = require('./jwt-payload');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const REFRESH_TOKEN_EXPIRY_SECONDS = 604_800;

// add jti
async function generateUserJwt(user) {
    return jwt.sign(userPayload(user), config.secret.user, { expiresIn: '15m', jwtid: uuidv4() })
}

// async function refreshUserJwt(user) {
//     return jwt.sign(userPayload(user), config.secret.user, { expiresIn: '7d', jwtid: uuidv4() })
// }

async function generateAdminJwt(admin) {
    return jwt.sign(adminPayload(admin), config.secret.admin, { expiresIn: '15m', jwtid: uuidv4() })
}

// async function refreshAdminJwt(admin) {
//     return jwt.sign(adminPayload(admin), config.secret.admin, { expiresIn: '7d', jwtid: uuidv4() })
// }

// generate opaque string
async function generateRefreshToken(){
    return crypto.randomBytes(16).toString('hex');
}

module.exports = {
    generateUserJwt,
    // refreshUserJwt,
    generateAdminJwt,
    // refreshAdminJwt,
    generateRefreshToken,
    REFRESH_TOKEN_EXPIRY_SECONDS
}
