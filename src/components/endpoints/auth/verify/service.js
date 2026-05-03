const repository = require('./repository');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const config = require('../../../../core/config');
const logger = require('../../../../core/logger')('verify-service');
const { hashOtp, passwordMatched } = require('../../../../utils/password');
const { errorResponder, errors } = require('../../../../core/errors');

function generateOTP(){
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
}

async function sendOTP(email, accountId, isResetPassword = false) {
    try {
        const otp = generateOTP();

        const hashedOtp = await hashOtp(otp);
        const save = await repository.saveOTP(email, accountId, hashedOtp, isResetPassword);

        if (save && save.rowCount > 0) {
            let transporter = nodemailer.createTransport({
                service: config.otp_sender.host,
                auth: {
                    user: config.otp_sender.email,
                    pass: config.otp_sender.password,
                }
            });

            try {
                await transporter.verify();
            } catch (err) {
                await repository.deleteOTP(email, accountId);
                throw errorResponder(errors.INTERNAL_SERVER_ERROR, 
                    "Terjadi error saat percobaan mengirim email OTP!");
            }

            // TO-DO: bikin email otp yang cantik (kalo sempet)
            const mailOptions = {
                from: `${config.otp_sender.email}`,
                to: email,
                subject: 'Kode OTP Kantin Sahera Pak Kirno',
                html: `<p>Halo, terima kasih telah menggunakan aplikasi kami!</p>
                        <p>Kode OTP Anda adalah: ${otp}</p>
                        <p>Kode ini hanya valid selama 15 menit.</p>
                `
            }

            let info = await transporter.sendMail(mailOptions);

            if (info.accepted.length > 0) {
                return true;
            } else if (info.rejected.length > 0) {
                logger.error(`Gagal mengirimkan pesan ke ${info.rejected[0]}`)
                await repository.deleteOTP(email, accountId);
                throw errorResponder(errors.UNPROCESSABLE_ENTITY, "OTP Tidak dapat dikirim ke email tujuan!");
            }
        } 
    } catch (err) {
        logger.error({err}, 'Terjadi error di layanan email!');
        await repository.deleteOTP(email, accountId);
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, 
            "Terjadi error pada saat percobaan mengirim OTP!"
        );
    }
}

async function verifyOTP(email, account_id, otp) {
    try {
        const query = await repository.findOTP(email, account_id);

        // asumsi cek daftar dulu
        // const existsOnUser = await userService.findByEmail(email);
        // const existsOnAdmin = await adminService.findByEmail(email);

        // if (!existsOnUser && !existsOnAdmin) 
        //     throw errorResponder(errors.NOT_FOUND, "Email tidak terdaftar!");
        
        if (query.rowCount === 0) 
            throw errorResponder(errors.NOT_FOUND, "Tidak ada OTP untuk email yang bersangkutan!");

        const data = query.rows[0];

        const expired = new Date(data.expires_at) < Date.now();

        if (expired) {
            throw errorResponder(errors.OTP_EXPIRED, "OTP yang diberikan sudah expired!");
        }
        
        const matched = await passwordMatched(otp, data.otp);

        if (!matched) 
            throw errorResponder(errors.INVALID_CREDENTIALS, "OTP yang dimasukkan salah!");
        else {
            return true;
        }
    } catch (err) {
        throw err;
    }
}

async function markAdminAsVerified(email) {
    try {
        const result = await repository.setAdminVerified(email);

        if (result) return true;
    } catch (err) {
        throw err;
    }
}

async function markUserAsVerified(email) {
    try {
        const result = await repository.setUserVerified(email);

        if (result) return true;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    sendOTP,
    verifyOTP,
    markAdminAsVerified,
    markUserAsVerified,
}