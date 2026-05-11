const Joi = require('joi');

// sanitasi field diluar definisi req body
const validator = (schema) => (payload) => schema.validate(payload, { stripUnknown: true });

/* Schema untuk Auth */

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

const passwordSchema = Joi.string().required().min(12).pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).messages({
    'any.required': "Password wajib ada!",
    'string.min': 'Panjang password harus 12 karakter ke atas!',
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

const time24hrSchema = Joi.string().pattern(/^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/); // HH:MM:SS 24 hr

const loginSchema = Joi.object({
    email: emailSchema,
    password: passwordSchema,
})

const imageUrlSchema = Joi.string().uri({
        scheme: ['https'],
        allowRelative: false,
    }).custom((value, helpers) => {
        const allowedDomains = ['res.cloudinary.com', 'lh3.googleusercontent.com'];
        const url = new URL(value);
        if (!allowedDomains.some(domain => url.hostname.includes(domain))) {
            return helpers.error('any.invalid', {
                message: 'Hanya Cloudinary dan Google picture domain yang diperbolehkan!'
            });
        }
        return value;
    }).messages({
        'string.uri': "URL gambar tidak valid atau tidak absolut!",
        'string.uriCustomScheme': 'URL harus menggunakan protokol HTTPS!',
        'any.invalid': 'Hanya Cloudinary dan Google picture domain yang diperbolehkan!'
    }),

const profileSchema = Joi.object({
    username: usernameSchema,
    profile_image_url: imageUrlSchema,
    phone_number: phoneNumberSchema,
});

const verifyOtpSchema = Joi.object({
    email: emailSchema,
    otp_code: otpSchema,
})

/* Schema untuk menu */

const menuNameSchema = Joi.string().trim(true).min(1).messages({
    'string.min': "Nama tidak boleh kurang dari 1 karakter!",
    'string.empty': "Nama tidak boleh kosong"
});

const menuPriceSchema = Joi.number().precision(2).min(0).required().messages({
    'number.min': "Harga harus berupa angka positif",
    'number.precision': "Harga harus memiliki angka desimal 2 posisi di belakang koma"
})

const menuSchema = Joi.object({
    name: menuNameSchema.required(),
    image_url: imageUrlSchema.optional(),
    price: menuPriceSchema.required(),
});

const menuChangeSchema = Joi.object({
    name: menuNameSchema.optional(),
    image_url: menuImageURLSchema.optional(),
    price: menuPriceSchema.optional(),
    is_available: Joi.bool().optional(),
})

const resetPasswordSchema = Joi.object({
    email: emailSchema,
    otp_code: otpSchema,
    password: passwordSchema,
    confirm_password: Joi.string().required().valid(Joi.ref("password")).messages({
        'any.only': "Password dan konfirmasi password tidak sesuai!"
    })
});

/* Schema untuk restaurant */

const restaurantOpenStatusSchema = Joi.string().valid('closed', 'open').trim().lowercase();

const restaurantUpdateStatusSchema = Joi.object({
    status: restaurantOpenStatusSchema.required(),
})

const restaurantDataSchema = Joi.object({
    schedule: Joi.array().items(Joi.object({
        day_name: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'), // Wajib lowercase bhs inggris
        open_time: time24hrSchema.optional(), // HH:MM:SS 24 hr format
        close_time: time24hrSchema.optional(), // same as open_time
        open: Joi.bool().optional()
    })).optional(),
    contacts: Joi.array().items(phoneNumberSchema).optional(),
    physical_place: Joi.object({
        open: time24hrSchema.optional(),
        close: time24hrSchema.optional(),
        day_closed: Joi.array().items(Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')).optional(),
    }).optional(),
    address: Joi.string().optional(),
    status: restaurantOpenStatusSchema.optional(),
})

/* Schema untuk carts & order */

const quantitySchema = Joi.number().min(1);

const cartItemSchema = Joi.object({
    menu_id: Joi.number().required(),
    quantity: quantitySchema.required(),
});

const cartItemQuantitySchema = Joi.object({
    quantity: quantitySchema.required(),
});

const orderSchema = Joi.object({
    location: Joi.string().allow(null),
    note: Joi.string().length(300).allow(null),
})

module.exports = {
    //  auth
    register: validator(registerSchema),
    login: validator(loginSchema),
    profile: validator(profileSchema),
    email: validator(emailSchema),
    verifyOtp: validator(verifyOtpSchema),
    resetPassword: validator(resetPasswordSchema),

    //  menu
    menu: validator(menuSchema),
    menuEdit: validator(menuChangeSchema),

    //  restaurant
    status: validator(restaurantUpdateStatusSchema),
    restaurant: validator(restaurantDataSchema),

    //  cart
    cartItem: validator(cartItemSchema),
    cartItemQuantity: validator(cartItemQuantitySchema),

    //order
    order: validator(orderSchema)
}