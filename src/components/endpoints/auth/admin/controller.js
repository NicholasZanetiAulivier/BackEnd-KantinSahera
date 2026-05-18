const { errorResponder, errors, processJoiValidationError } = require('../../../../core/errors');
const validate = require('../../../middlewares/validator')
const service = require('./service');
const otpService = require('../verify/service');
const tokenService = require('../token/service');
const { hashPassword, passwordMatched } = require('../../../../utils/password');
const { generateAdminJwt, refreshAdminJwt } = require('../../../../utils/token');
const { auth } = require('google-auth-library');

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
                throw errorResponder(errors.INVALID_TOKEN, "Proses login gagal!");
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

            setTimeout(() => {
                return res.status(204).end();
            }, simulatedTime);
        }

        const mailed = await otpService.sendOTP(email, true);

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

        const valid = await otpService.verifyOTP(email, otp_code, true);

        if (valid) {
            const result = await otpService.markAccountAsVerified(email, true);

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

        const valid = await otpService.checkOtpMatched(email, otp_code, true);

        if (valid) return res.status(204).end();
        else throw errorResponder(errors.INVALID_CREDENTIALS, "OTP yang dimasukkan tidak sesuai!");
    } catch (err) {
        return next(err);
    }
}

async function resetPassword(req, res, next) {
    try {
        const { jti } = req.user;

        const { error, value } = validate.resetPassword(req.body);

        processJoiValidationError(error);

        const { email, otp_code, password, confirm_password } = value;

        const user = await service.findByEmail(email);

        if (!user) return res.status(204).end();

        // set boolean flag ke true untuk email akun admin
        const valid = await otpService.verifyOTP(email, otp_code, true);

        if (valid) {
            // kirim plaintext password
            const result = await otpService.resetAccountPassword(email, password, true);

            if (result) {
                if (jti) await tokenService.invalidateJti(token.jti);

                return res.status(204).end();
            } 
        }
    } catch (err) {
        return next(err);
    }
}

async function refreshToken(req, res, next) {
    try {
        const authorization = req.headers.authorization;
        const accessToken = authorization.split('Bearer ')[1];

        const result = await service.createRefreshToken(accessToken);

        if (result) return res.status(200).json({token: result}) 
    } catch (err) {
        return next(err);
    }
}

async function logout(req, res, next) {
    try {
        const { exp, jti } = req.user;

        const result = await tokenService.invalidateJti(exp, jti);

        if (result) return res.status(204).end();
    } catch (err) {
        return next(err);
    }
}

async function getAdmins(req, res, next) {
 
    try {
 
        const admins = await service.getAllAdmins();
 
        return res.status(200).json({ admins });
    } catch (err) {
        return next(err);
    }
}
 
async function editAdmin(req, res, next) {
    try {
        const targetId = req.params.id;

        const { error, value } = validate.adminEdit(req.body);

        processJoiValidationError(error);

        const { username, email } = value;

        // Cek target admin ada
        const target = await service.findById(parseAdminId(targetId));
 
        if (!target) {
            throw errorResponder(errors.NOT_FOUND, "Admin tidak ditemukan!");
        }
        // Jika email diubah, cek duplikat
        if (email && email !== target.email) { 
            const emailExists = await service.findByEmail(email);
 
            if (emailExists) {
                throw errorResponder(errors.DB_DUPLICATE_CONFLICT, "Email sudah digunakan admin lain!");
            }
        }

        const result = await service.updateAdmin(parseAdminId(targetId), username, email);
 
        if (result && result.rowCount > 0) {
            return res.status(200).json({ message: "Data admin berhasil diperbarui." });
        }
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Gagal memperbarui data admin.");
    } catch (err) {
        return next(err);
    }
}

async function deleteAdmin(req, res, next) {
    try {
        const targetId = req.params.id;

        // Cek target admin ada
        const target = await service.findById(parseAdminId(targetId));
 
        if (!target) {
            throw errorResponder(errors.NOT_FOUND, "Admin tidak ditemukan!");
        }
        // Tolak jika target adalah super admin
        if (target.super_admin) {
            throw errorResponder(errors.INVALID_CREDENTIALS, "Super admin tidak dapat dihapus!");
        }

        const result = await service.deleteAdmin(parseAdminId(targetId));

        if (result && result.rowCount > 0) {
            return res.status(204).end();
        }
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Gagal menghapus admin.");
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    register,
    login,
    requestAdminOtp,
    verifyAdminEmailByOtp,
    checkOtpMatched,
    resetPassword,
    refreshToken,
    logout,
    getAdmins,
    editAdmin,
    deleteAdmin
}