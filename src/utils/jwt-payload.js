const config = require('../core/config')

const userPayload = user => ({
    user_id: config.keys_prefix.user_id + user.user_id,
    username: user.username || 'Tanpa Nama',
    email: user.email,
    verified: user.verified
}) 

const adminPayload = admin => ({ 
    admin_id: config.keys_prefix.admin_id + admin.admin_id,
    username: admin.username || 'Admin',
    email: admin.email,
    super_admin: admin.super_admin,
    verified: admin.verified
});

module.exports = {
    userPayload,
    adminPayload,
}