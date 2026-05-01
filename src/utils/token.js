const jwt = require('jsonwebtoken');
const config = require('../core/config');
const { userPayload, adminPayload } = require('./jwt-payload');

async function generateUserJwt(user) {
    return jwt.sign(userPayload(user), config.secret.user, { expiresIn: '15m' })
}

async function refreshUserJwt(user) {
    return jwt.sign(userPayload(user), config.secret.user, { expiresIn: '7d' })
}

async function generateAdminJwt(admin) {
    return jwt.sign(adminPayload(admin), config.secret.admin, { expiresIn: '15m' })
}

async function refreshAdminJwt(admin) {
    return jwt.sign(adminPayload(admin), config.secret.admin, { expiresIn: '7d' })
}

module.exports = {
    generateUserJwt,
    refreshUserJwt,
    generateAdminJwt,
    refreshAdminJwt,
}
