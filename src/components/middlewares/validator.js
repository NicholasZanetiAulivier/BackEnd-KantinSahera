const Joi = require('joi');

// sanitasi field diluar definisi req body
const validator = (schema) => (payload) => schema.validate(payload, { stripUnknown: true });

// username ======= nama tampilan
// password harus alphanumeric, min 3 char max 30 char (validation level)
// why password is required here? because google auth doesnt need our login/register form
const registerSchema = Joi.object({
    username: Joi.string().min(1).max(32).trim(),
    email: Joi.string().required().email().trim(),
    password: Joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
    confirm_password: Joi.ref("password")
});

const loginSchema = Joi.object({
    email: Joi.string().required().email().trim(),
    password: Joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
})

module.exports = {
    register: validator(registerSchema),
}