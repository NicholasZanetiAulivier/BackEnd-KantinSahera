const repository = require('./repository');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const config = require('../../../../core/config');
const {logger} = require('../../../../core/logger');
const { hashOtp, hashPassword, passwordMatched } = require('../../../../utils/password');
const { errorResponder, errors } = require('../../../../core/errors');

function generateOTP() {
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
}

// default ke false untuk is_admin
async function sendOTP(email, is_admin = false) {
    try {
        const otp = generateOTP();

        const hashedOtp = await hashOtp(otp);
        const save = await repository.saveOTP(email, hashedOtp, is_admin);

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
                await repository.deleteOTP(email,  is_admin);
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
                        <p>Kode ini hanya valid selama ${config.otp_time} menit.</p>
                `
            }

            let info = await transporter.sendMail(mailOptions);

            if (info.accepted.length > 0) {
                return true;
            } else if (info.rejected.length > 0) {
                logger.error(`Gagal mengirimkan pesan ke ${info.rejected[0]}`)
                await repository.deleteOTP(email, is_admin);
                throw errorResponder(errors.UNPROCESSABLE_ENTITY, "OTP Tidak dapat dikirim ke email tujuan!");
            }
        }
    } catch (err) {
        logger.error({ err }, 'Terjadi error di layanan email!');
        await repository.deleteOTP(email, is_admin);
        throw errorResponder(errors.INTERNAL_SERVER_ERROR,
            "Terjadi error pada saat percobaan mengirim OTP!"
        );
    }
}

// mengecek hash dan increment percobaan saat otp salah
async function verifyOTP(email, plaintext_otp, is_admin = false) {
    try {
        const query = await repository.findOTP(email, is_admin);

        const invalidMessage = "OTP yang dikirim salah atau tidak berlaku lagi!";

        // generalisasikan, 404 artinya bisa juga endpoint yg dituju gk ada
        if (query.rowCount === 0)
            throw errorResponder(errors.INVALID_CREDENTIALS, invalidMessage); 

        const data = query.rows[0];

        if (data.attempt_count >= 3) {
            throw errorResponder(errors.TOO_MANY_REQUEST);
        }

        const expired = new Date(data.expires_at) < Date.now();

        if (expired) 
            throw errorResponder(errors.INVALID_CREDENTIALS, invalidMessage);

        const matched = await passwordMatched(plaintext_otp, data.otp);

        if (!matched) {
            const failedCount = await repository.incrementAttemptsCount(email, is_admin);
            throw errorResponder(errors.INVALID_CREDENTIALS, invalidMessage);
        } else {
            return true;
        }
    } catch (err) {
        throw err;
    }
}

// ini bakal aku delete, setelah dipikir2 kalo nyediakan fungsi ginian malah bikin otp check rawan brute force attack
// // hanya mengecek hash, tidak increment percobaan jika hash salah
// async function checkOtpMatched(email, plaintext_otp, is_admin = false) {
//     try {
//         const query = await repository.findOTP(email, is_admin);

//         // generalisasikan untuk otp yang tidak ada, anggap ini otp salah
//         if (query.rowCount === 0) return false;

//         const data = query.rows[0];

//         const matched = await passwordMatched(plaintext_otp, data.otp);

//         if (!matched) {
//             return false;
//         } else {
//             return true;
//         }
//     } catch (err) {
//         throw err;
//     }
// }

async function resetAccountPassword(email, plaintext_password, is_admin = false) {
    try {
        // wajib manggil hashPassword untuk hash password (jangan ketukar dg otp)
        const hashedPassword = await hashPassword(plaintext_password);

        const result = await repository.updateAccountPassword(email, hashedPassword, is_admin);

        if (result) return true;
    } catch (err) {
        throw err;
    }
}

async function markAccountAsVerified(email, is_admin = false) {
    try {
        const result = await repository.setAccountVerified(email, is_admin);

        if (result) return true;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    sendOTP,
    verifyOTP,
    // checkOtpMatched,
    resetAccountPassword,
    markAccountAsVerified,
}