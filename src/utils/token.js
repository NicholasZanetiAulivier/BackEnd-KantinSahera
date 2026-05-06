const jwt = require('jsonwebtoken');
const config = require('../core/config');
const { userPayload, adminPayload } = require('./jwt-payload');
const { v4: uuidv4 } = require('uuid');

// add jti
async function generateUserJwt(user) {
    return jwt.sign(userPayload(user), config.secret.user, { expiresIn: '15m', jwtid: uuidv4() })
}

async function refreshUserJwt(user) {
    return jwt.sign(userPayload(user), config.secret.user, { expiresIn: '7d', jwtid: uuidv4() })
}

async function generateAdminJwt(admin) {
    return jwt.sign(adminPayload(admin), config.secret.admin, { expiresIn: '15m', jwtid: uuidv4() })
}

async function refreshAdminJwt(admin) {
    return jwt.sign(adminPayload(admin), config.secret.admin, { expiresIn: '7d', jwtid: uuidv4() })
}

module.exports = {
    generateUserJwt,
    refreshUserJwt,
    generateAdminJwt,
    refreshAdminJwt,
}
