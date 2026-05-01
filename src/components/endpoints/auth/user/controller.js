const { errorResponder, errors, processJoiValidationError } = require('../../../../core/errors');
const validate = require('../../../middlewares/validator')
const service = require('./service');
const { hashPassword, passwordMatched } = require('../../../../utils/password');
const { generateUserJwt, refreshUserJwt } = require('../../../../utils/token');
const { parseUserId } = require('../../../middlewares/authentication');

async function register(req, res, next) {
    try {
        const { username, email, password, confirm_password } = req.body;

        const { error, value } = validate.register(req.body);

        processJoiValidationError(error);

        const emailExists = await service.findByEmail(email);

        if (emailExists) {
            throw errorResponder(errors.DB_DUPLICATE_CONFLICT, "Email sudah ada!");
        }

        const passwordHash = await hashPassword(password);

        const result = await service.createUser({ username, email, passwordHash });

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

        const passwordValid = await passwordMatched(password, user.password);

        if (passwordValid) {
            // destructure object so only username and email is sent
            const { username, email } = user;
            const token = await generateUserJwt({ username, email });

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


module.exports = {
    register,
    login,
    changeProfile,
    getProfile,
}