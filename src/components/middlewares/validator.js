const Joi = require('joi');

// sanitasi field diluar definisi req body
const validator = (schema) => (payload) => schema.validate(payload, { stripUnknown: true });

// username ======= nama tampilan
// password harus alphanumeric, min 3 char max 30 char (validation level)
// why password is required here? because google auth doesnt need our login/register form
const emailSchema = Joi.string().required().email().trim().messages({
    'any.required': "Email wajib ada!",
    'string.email': "Format email tidak valid!"
})

const usernameSchema = Joi.string().min(1).max(32).trim().messages({
    'string.min': "Username tidak boleh kurang dari 1 karakter!",
    'string.empty': "Username tidak boleh kosong!",
    'string.max': "Panjang username tidak boleh lebih dari 32 karakter!"
})

const passwordSchema = Joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).messages({
    'any.required': "Password wajib ada!",
    'string.pattern.base': "Password harus berupa alphanumeric!",
    'any.only': "Password dan confirm password tidak sesuai!"
})

const otpSchema = Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
    'string.length': 'Kode OTP harus berupa angka enam digit!',
    'string.pattern.base': 'Kode OTP harus berupa angka!',
    'any.required': 'Kode OTP wajib ada!'
})

const phoneNumberSchema = Joi.string().pattern(new RegExp('^(\\+62|62|0)[8123456789][0-9]{8,13}$')).trim()
    .messages({
        'string.pattern.base': 'Format nomor HP harus merupakan nomor Indonesia yang valid, dimulai dari +62 atau 08 tanpa spasi!'
    })

const registerSchema = Joi.object({
    username: usernameSchema,
    email: emailSchema,
    phone_number: phoneNumberSchema,
    password: passwordSchema,
    confirm_password: Joi.string().required().valid(Joi.ref("password")).messages({
        'any.only': "Password dan konfirmasi password tidak sesuai!"
    })
});

const loginSchema = Joi.object({
    email: emailSchema,
    password: passwordSchema,
})

const profileSchema = Joi.object({
    username: usernameSchema,
    profile_image_url: Joi.string().uri().messages({
        'string.uri': "URL gambar tidak valid!",
    }),
    phone_number: phoneNumberSchema,
});

const verifyOtpSchema = Joi.object({
    email: emailSchema,
    otp_code: otpSchema,
})

/* Schema untuk menu */
const menuSchema = Joi.object({
    name: Joi.string().trim(true).min(1).required().messages({
        'string.min': "Nama tidak boleh kurang dari 1 karakter!",
        'string.empty': "Nama tidak boleh kosong"
    }),
    image_url: Joi.string().uri().messages({
        'string.uri': "Image URL harus berupa URL yang valid"
    }),
    price: Joi.number().precision(2).min(0).required().messages({
        'number.min': "Harga harus berupa angka positif",
        'number.precision': "Harga harus memiliki angka desimal 2 posisi di belakang koma"
    })
})

module.exports = {
    register: validator(registerSchema),
    login: validator(loginSchema),
    profile: validator(profileSchema),
    email: validator(emailSchema),
    verifyOtp: validator(verifyOtpSchema),

    menu: validator(menuSchema),
}