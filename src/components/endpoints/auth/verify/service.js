const repository = require('./repository');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const config = require('../../../../core/config');
const { hashPassword, passwordMatched } = require('../../../../utils/password');
const { errorResponder, errors } = require('../../../../core/errors');

function generateOTP(){
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
}

async function sendOTP(email) {
    try {
        const otp = generateOTP();

        const hashedOtp = await hashPassword(otp);
        const save = await repository.saveOTP(email, hashedOtp);

        if (save && save.rowCount > 0) {
            let transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: config.otp_sender.email,
                    pass: config.otp_sender.password,
                }
            });

            try {
                await transporter.verify();
            } catch (err) {
                await repository.deleteOTP(email);
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
            console.log("Email sent successfully:", info.messageId);

            if (info.accepted.length > 0) {
                return true;
            } else if (info.rejected.length > 0) {
                await repository.deleteOTP(email);
                throw errorResponder(errors.UNPROCESSABLE_ENTITY, "OTP Tidak dapat dikirim ke email tujuan!");
            }
        } 
    } catch (err) {
        console.error("Error in sendOTP:", err.message);
        await repository.deleteOTP(email);
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, 
            "Terjadi error pada saat percobaan mengirim OTP!"
        );
    }
}

async function verifyOTP(email, otp) {
    try {
        const query = await repository.findOTP(email);
        
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
            const verified = await repository.markAsVerified(email);
            console.log(verified);

            return verified;
        }
    } catch (err) {
        throw err;
    }
}

module.exports = {
    sendOTP,
    verifyOTP,
}