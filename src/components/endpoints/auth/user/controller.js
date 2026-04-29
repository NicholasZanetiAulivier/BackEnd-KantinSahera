const { errorResponder, errors } = require('../../../../core/errors');
const validate = require('../../../middlewares/validator')
const service = require('./service');
const {hashPassword, passwordMatched} = require('../../../../utils/password')

async function register(req, res, next) {
    try {
        const {username, email, password, confirm_password} = req.body;

        const {error, value} = validate.register(req.body);

        // console.log(error)
        if (error) {
            throw errorResponder(errors.BAD_REQUEST, error.details[0].message)
        }

        const emailExists = await service.emailExists(email);

        console.log(emailExists);

        if (emailExists) {
            throw errorResponder(errors.DB_DUPLICATE_CONFLICT, "Email sudah ada!");
        }

        const hashedPassword = await hashPassword(password);

        const result = await service.createUser({username, email, hashedPassword});

        if (result) {
            return res.status(201).json({message: "Akun user berhasil dibuat."});
        }
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    register,
}