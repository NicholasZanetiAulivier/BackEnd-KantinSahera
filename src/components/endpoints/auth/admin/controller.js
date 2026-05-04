const { errorResponder, errors, processJoiValidationError } = require('../../../../core/errors');
const validate = require('../../../middlewares/validator')
const service = require('./service');
const otpService = require('../verify/service');
const { hashPassword, passwordMatched } = require('../../../../utils/password');
const { generateAdminJwt, refreshAdminJwt } = require('../../../../utils/token');

async function register(req, res, next) {
    try {
        const { error, value } = validate.register(req.body);

        processJoiValidationError(error);

        const { email, password, confirm_password } = value;

        const emailExists = await service.findByEmail(email);

        if (emailExists) {
            throw errorResponder(errors.DB_DUPLICATE_CONFLICT, "Email sudah ada!");
        }

        const passwordHash = await hashPassword(password);

        const result = await service.createAdmin({ email, passwordHash });

        if (result.rowCount > 0)
            return res.status(201).json({ message: "Akun admin berhasil dibuat." });
    } catch (err) {
        return next(err);
    }
}

async function login(req, res, next) {
    try {
        const { error, value } = validate.login(req.body);

        processJoiValidationError(error);

        const { email, password } = value;

        const admin = await service.findByEmail(email);

        if (!admin) {
            throw errorResponder(errors.INVALID_CREDENTIALS, "Email atau kata sandi salah!");
        }

        const passwordValid = await passwordMatched(password, admin.password);

        admin.password = null;

        if (passwordValid) {
            const token = await generateAdminJwt(admin);

            if (!token) {
                throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Proses login gagal!");
            }

            return res.status(200).json({ token: token });
        } else {
            throw errorResponder(errors.INVALID_CREDENTIALS, "Email atau kata sandi salah!");
        }
    } catch (err) {
        return next(err);
    }
}

async function requestAdminOtp(req, res, next) {
    try {
        const { email } = req.body

        const { error, value } = validate.email(email);

        processJoiValidationError(error);

        const admin = await service.findByEmail(email);

        // kasus request otp pada akun yang tidak terdaftar
        // simulasikan lama proses pengiriman email via nodemailer (pake setTimeout)
        if (!admin) {
            // 3 - 5 detik
            min = Math.ceil(3000);
            max = Math.floor(5000);
            const simulatedTime = Math.floor(Math.random() * (max - min + 1)) + min;

            return setTimeout(() => {
                return res.status(204).end();
            }, simulatedTime);
        }

        const mailed = await otpService.sendOTP(email, admin.admin_id, true);

        if (mailed) return res.status(204).end();
    } catch (err) {
        return next(err);
    }
}

async function verifyAdminEmailByOtp(req, res, next) {
    try {
        const { error, value } = validate.verifyOtp(req.body);

        processJoiValidationError(error);

        const { email, otp_code } = value;

        const admin = await service.findByEmail(email);

        if (!admin) return res.status(204).end();

        const valid = await otpService.verifyOTP(email, admin.admin_id, otp_code, true);

        if (valid) {
            const result = await otpService.markAdminAsVerified(email, admin.admin_id);

            if (result) return res.status(204).end();
        }
    } catch (err) {
        return next(err);
    }
}

async function checkOtpMatched(req, res, next) {
    try {
        const { error, value } = validate.verifyOtp(req.body);
        processJoiValidationError(error);

        const { email, otp_code } = value;

        const admin = await service.findByEmail(email);

        // generalisasikan error untuk mencegah account enumeration
        if (!admin) throw errorResponder(errors.INVALID_CREDENTIALS, "OTP yang dimasukkan tidak sesuai!");

        const valid = await otpService.checkOtpMatched(email, admin.admin_id, otp_code, true);

        if (valid) return res.status(204).end();
        else throw errorResponder(errors.INVALID_CREDENTIALS, "OTP yang dimasukkan tidak sesuai!");
    } catch (err) {
        return next(err);
    }
}


module.exports = {
    register,
    login,
    requestAdminOtp,
    verifyAdminEmailByOtp,
    checkOtpMatched
}