const { errorResponder, errors, processJoiValidationError } = require('../../../../core/errors');
const validate = require('../../../middlewares/validator')
const service = require('./service');
const { hashPassword, passwordMatched } = require('../../../../utils/password');
const { generateAdminJwt, refreshAdminJwt } = require('../../../../utils/token');

async function register(req, res, next) {
    try {
        const { email, password, confirm_password } = req.body;

        const { error, value } = validate.register(req.body);

        processJoiValidationError(error);

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
        const { email, password } = req.body;

        const { error, value } = validate.login(req.body);

        processJoiValidationError(error);

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

module.exports = {
    register,
    login,
}