const repository = require('./repository');
const jwt = require('jsonwebtoken');

async function generateJwt(user) {
    return jwt.sign({
        username: user.username || 'Tanpa Nama',
        email: user.email,
    }, process.env.USER_JWT_SECRET, {expiresIn: '15m'})
}

async function refreshJwt(user) {
    return jwt.sign({
        username: user.username || 'Tanpa Nama',
        email: user.email,
    }, process.env.USER_JWT_SECRET, {expiresIn: '7d'})
}

async function emailExists(email) {
    const res = await repository.findEmail(email);
    
    if (Array.isArray(res.rows) && res.rows.length === 0) {
        return false;
    } else {
        return true;
    }
}

async function createUser(user) {
    const res = await repository.createUser(user);

    return res.rows[0];
}

module.exports = {
    generateJwt,
    refreshJwt,
    emailExists,
    createUser,
}