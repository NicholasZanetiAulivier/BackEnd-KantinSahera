const config = require('../core/config');
const { errorResponder, errors } = require('../core/errors');

function parseUserId(userId) {
    const id = userId.split(config.keys_prefix.user_id);
    console.log(id);
    const idWithoutPrefix = id[1] || null;

    if (idWithoutPrefix) return idWithoutPrefix;
    else throw errorResponder(errors.BAD_ID, "ID payload bukan ID User yang valid!");
}

function parseAdminId(adminId) {
    const id = adminId.split(config.keys_prefix.admin_id);
    const idWithoutPrefix = id[1] || null;

    if (idWithoutPrefix) return idWithoutPrefix;
    else throw errorResponder(errors.BAD_ID, "ID payload bukan ID Admin yang valid!");
}

module.exports = {
    parseUserId,
    parseAdminId,
}