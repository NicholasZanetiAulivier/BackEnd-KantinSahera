const { errorResponder, errors, processJoiValidationError } = require('../../../../core/errors');
const validate = require('../../../middlewares/validator')
const service = require('./service');
const otpService = require('../verify/service');
const { hashPassword, passwordMatched } = require('../../../../utils/password');
const { generateUserJwt, refreshUserJwt } = require('../../../../utils/token');
const { parseUserId } = require('../../../middlewares/authentication');
const config = require('../../../../core/config');

async function register(req, res, next) {
    try {
        const { username, email, phone_number, password, confirm_password } = req.body;

        const { error, value } = validate.register(req.body);

        processJoiValidationError(error);

        const emailExists = await service.findByEmail(email);

        if (emailExists) {
            throw errorResponder(errors.DB_DUPLICATE_CONFLICT, "Email sudah ada!");
        }

        const passwordHash = await hashPassword(password);

        const result = await service.createUser({ username, email, phone_no: phone_number, passwordHash });

        if (result.rowCount > 0)
            return res.status(201).json({ message: "Akun user berhasil dibuat." });
    } catch (err) {
        return next(err);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        const { error, value } = validate.login(req.body);

        let invalidField = null;

        processJoiValidationError(error);

        const user = await service.findByEmail(email);

        if (!user) {
            throw errorResponder(errors.INVALID_CREDENTIALS, "Email atau kata sandi salah!");
        }

        // generalisasikan error (ini kalo password database null, register lewat google)
        if (!user.password) {
            throw errorResponder(errors.INVALID_CREDENTIALS, 'Email atau kata sandi salah!');
        }

        const passwordValid = await passwordMatched(password, user.password);

        user.password = null;

        if (passwordValid) {
            // destructure object so only username and email is sent
            const token = await generateUserJwt(user);

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

async function changeProfile(req, res, next) {
    try {
        const { username, profile_image_url, phone_number } = req.body;

        const { error, value } = validate.profile(req.body);

        const id = parseUserId(req.user.user_id);

        processJoiValidationError(error);

        const result = await service.changeProfileWhereId({ username, profile_image_url, phone_number, user_id: id });

        console.log(result);

        if (result.rowCount > 0) return res.status(204).end();
        else if (result.rowCount === 0) throw errorResponder(errors.NOT_FOUND, "Email yang diberikan tidak ada!");
    } catch (err) {
        return next(err);
    }
}

async function getProfile(req, res, next) {
    try {
        const id = parseUserId(req.user.user_id);

        const profile = await service.getProfileById(id);

        if (profile) return res.status(200).json(profile);
    } catch (err) {
        return next(err);
    }
}

async function requestUserOtp(req, res, next) {
    try {
        const { email } = req.body

        const { error, value } = validate.email(email);

        processJoiValidationError(error);

        const user = await service.findByEmail(email);

        // kasus request otp pada akun yang tidak terdaftar
        // simulasikan lama proses pengiriman email via nodemailer (pake setTimeout)
        if (!user) {
            // 3 - 5 detik
            min = Math.ceil(3000);
            max = Math.floor(5000);
            const simulatedTime = Math.floor(Math.random() * (max - min + 1)) + min;

            return setTimeout(() => {
                return res.status(204).end();
            }, simulatedTime);
        }

        const mailed = await otpService.sendOTP(email, user.user_id);

        if (mailed) return res.status(204).end();
    } catch (err) {
        return next(err);
    }
}

async function verifyUserEmailByOtp(req, res, next) {
    try {
        const { email, otp_code } = req.body;

        const { error, value } = validate.verifyOtp({ email, otp_code });

        const user = await service.findByEmail(email);

        if (!user) return res.status(204).end();

        processJoiValidationError(error);

        const valid = await otpService.verifyOTP(email, user.user_id, otp_code);

        if (valid) {
            const result = await otpService.markUserAsVerified(email, user.user_id);

            if (result) return res.status(204).end();
        }
    } catch (err) {
        return next(err);
    }
}

// https://developers.google.com/identity/sign-in/web/backend-auth
// https://developers.google.com/identity/gsi/web/reference/html-reference
// https://developers.google.com/identity/gsi/web/guides/overview
async function handleGoogleAuth(req, res, next) {
    try {
        // credential = id token JWT dari Google (ngikut docs)
        const { credential } = req.body

        const idTokenValid = await service.verifyGoogleIdToken(credential);

        const result = await service.handleGoogleAuth(idTokenValid);

        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}

async function resetPassword(req, res, next) {
    try {
        const { email, otp_code, password, confirm_password } = req.body;

        const { error, value } = validate.resetPassword({ email, otp_code, password, confirm_password });

        const user = await service.findByEmail(email);

        if (!user) return res.status(204).end();

        processJoiValidationError(error);

        const valid = await otpService.verifyOTP(email, user.user_id, otp_code);

        if (valid) {
            // kirim plaintext password
            const result = await otpService.resetUserPassword(email, user.user_id, password);

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

        const user = await service.findByEmail(email);

        // generalisasikan error untuk mencegah account enumeration
        if (!user) throw errorResponder(errors.INVALID_CREDENTIALS, "OTP yang dimasukkan tidak sesuai!");

        const valid = await otpService.checkOtpMatched(email, user.user_id, otp_code);

        if (valid) return res.status(204).end();
        else throw errorResponder(errors.INVALID_CREDENTIALS, "OTP yang dimasukkan tidak sesuai!");
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    register,
    login,
    changeProfile,
    getProfile,
    requestUserOtp,
    verifyUserEmailByOtp,
    handleGoogleAuth,
    resetPassword,
    checkOtpMatched,
}