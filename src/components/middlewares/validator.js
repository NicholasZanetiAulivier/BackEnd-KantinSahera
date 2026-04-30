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

const profileSchema = Joi.object({
    username: Joi.string().min(1).max(32).trim(),
    profile_image_url: Joi.string().uri(),
    phone_number: Joi.string().pattern(new RegExp('^(\\+62|62|0)[8123456789][0-9]{8,13}$')).trim(),
});

module.exports = {
    register: validator(registerSchema),
    login: validator(loginSchema),
    profile: validator(profileSchema),
}