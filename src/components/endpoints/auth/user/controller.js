const { errorResponder, errors } = require('../../../../core/errors');
const validate = require('../../../middlewares/validator')
const service = require('./service');
const { hashPassword, passwordMatched } = require('../../../../utils/password');
const { generateUserJwt, refreshUserJwt } = require('../../../../utils/token');

async function register(req, res, next) {
    try {
        const { username, email, password, confirm_password } = req.body;

        const { error, value } = validate.register(req.body);

        // TO-DO: Implement more concise validation error messages
        if (error) {
            throw errorResponder(errors.BAD_REQUEST, error.details[0].message)
        }

        const emailExists = await service.findByEmail(email);

        if (emailExists) {
            throw errorResponder(errors.DB_DUPLICATE_CONFLICT, "Email sudah ada!");
        }

        const passwordHash = await hashPassword(password);

        const result = await service.createUser({ username, email, passwordHash });

        if (result.rowCount > 0) {
            return res.status(201).json({ message: "Akun user berhasil dibuat." });
        } else {
            throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Gagal membuat akun user");
        }
    } catch (err) {
        return next(err);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        const { error, value } = validate.login(req.body);

        let invalidField = null;

        if (error) {
            invalidField = error.details[0].context.key;
        }

        if (invalidField === 'password') {
            if (error.details[0].type === 'any.required'){
                throw errorResponder(errors.BAD_REQUEST, "Password wajib ada!")
            } else {
                // asumsi password ada tapi format invalid
                throw errorResponder(errors.UNPROCESSABLE_ENTITY, "Password harus berupa alfanumerik!");
            }

        } else if (invalidField === 'email') {
            if (error.details[0].type === 'any.required'){
                throw errorResponder(errors.BAD_REQUEST, "Email wajib ada!")
            } else {
                throw errorResponder(errors.UNPROCESSABLE_ENTITY, "Format email tidak valid!");
            }
        }

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

async function changeUsername(req, res, next) {
    try {
        console.log('curr attached user ', req.user)
        const {username} = req.body;

        const { error, value } = validate.username(req.body);

        let invalidField = null;

        if (error) {
            invalidField = error.details[0].context.key;
        }

        // TO-DO: Implement more concise validation error messages
        if (invalidField === 'username') {
            if (error.details[0].type === 'any.required'){
                throw errorResponder(errors.BAD_REQUEST, "Username (nama tampilan) pengguna wajib ada!")
            } else {
                throw errorResponder(errors.UNPROCESSABLE_ENTITY, "Format username tidak valid!");
            }
        }

        const result = await service.changeUsernameWhereEmail({username, email: req.user.email});

        console.log(result);

        if (result.rowCount > 0) return res.status(204).send();
        else if (result.rowCount === 0) throw errorResponder(errors.NOT_FOUND, "Email yang diberikan tidak ada!");
        else throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Terjadi error saat percobaan perubahan username!");
    } catch (err) {
        return next(err);
    }
}


module.exports = {
    register,
    login,
    changeUsername,
}