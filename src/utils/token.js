const jwt = require('jsonwebtoken');
const config = require('../core/config');

async function generateUserJwt(user) {
    return jwt.sign({
        username: user.username || 'Tanpa Nama',
        email: user.email,
    }, config.secret.user, { expiresIn: '15m' })
}

async function refreshUserJwt(user) {
    return jwt.sign({
        username: user.username || 'Tanpa Nama',
        email: user.email,
    }, config.secret.user, { expiresIn: '7d' })
}

async function generateAdminJwt(admin) {
    return jwt.sign({
        username: admin.username || 'Admin',
        email: admin.email,
        super_admin: admin.super_admin,
    }, config.secret.admin, { expiresIn: '15m' })
}

async function refreshAdminJwt(admin) {
    return jwt.sign({
        username: admin.username || 'Admin',
        email: admin.email,
        super_admin: admin.super_admin,
    }, config.secret.admin, { expiresIn: '7d' })
}

module.exports = {
    generateUserJwt,
    refreshUserJwt,
    generateAdminJwt,
    refreshAdminJwt,
}
