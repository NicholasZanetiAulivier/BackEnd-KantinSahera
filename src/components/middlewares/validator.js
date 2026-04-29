const Joi = require('joi');

const validator = (schema) => (payload) => schema.validate(payload);

// username ======= nama tampilan
// password harus alphanumeric, min 3 char max 30 char (validation level)
// why password is required here? because google auth doesnt need our login/register form
const registerSchema = Joi.object({
    username: Joi.string().min(1).max(32),
    email: Joi.string().required().email(),
    password: Joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
    confirm_password: Joi.ref("password")
});

module.exports = {
    register: validator(registerSchema),
}