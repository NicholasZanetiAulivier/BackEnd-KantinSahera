const Joi = require('joi');

// sanitasi field diluar definisi req body
const validator = (schema) => (payload) => schema.validate(payload, { stripUnknown: true });

// username ======= nama tampilan
// password harus alphanumeric, min 3 char max 30 char (validation level)
// why password is required here? because google auth doesnt need our login/register form
const registerSchema = Joi.object({
    username: Joi.string().min(1).max(32).trim().messages({
        'string.min': "Username tidak boleh kosong!",
        'string.max': "Panjang username tidak boleh lebih dari 32 karakter!"
    }),
    email: Joi.string().required().email().trim().messages({
        'any.required': "Email wajib ada!",
        'string.email': "Format email tidak valid!",
    }),
    password: Joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).messages({
        'any.required': "Password wajib ada!",
        'string.pattern.base': "Password harus berupa alphanumeric!",
        'any.only': "Password dan confirm password tidak sesuai!"
    }),
    confirm_password: Joi.string().required().valid(Joi.ref("password")).messages({
        'any.only': "Password dan konfirmasi password tidak sesuai!"
    })
});

const loginSchema = Joi.object({
    email: Joi.string().required().email().trim().messages({
        'any.required': "Email wajib ada!",
        'string.email': "Format email tidak valid!",
    }),
    password: Joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).messages({
        'any.required': "Password wajib ada!",
        'string.pattern.base': "Password harus berupa alphanumeric!"
    }),
})

const profileSchema = Joi.object({
    username: Joi.string().min(1).max(32).trim().messages({
        'string.min': "Username tidak boleh kosong!",
        'string.max': "Panjang username tidak boleh lebih dari 32 karakter!"
    }),
    profile_image_url: Joi.string().uri().messages({
        'string.uri': "URL gambar tidak valid!",
    }),
    phone_number: Joi.string().pattern(new RegExp('^(\\+62|62|0)[8123456789][0-9]{8,13}$')).trim()
    .messages({
        'string.pattern.base': 'Format nomor HP harus merupakan nomor Indonesia yang valid, dimulai dari +62 atau 08!'
    }),
});

module.exports = {
    register: validator(registerSchema),
    login: validator(loginSchema),
    profile: validator(profileSchema),
}