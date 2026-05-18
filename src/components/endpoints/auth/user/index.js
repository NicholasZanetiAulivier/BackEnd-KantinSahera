const express = require('express');
const controller = require('./controller');
const { passportUserJwt, userOptionalAuth } = require('../../../middlewares/authentication');
const { createLimiter } = require('../../../middlewares/limiter');

const route = express.Router();

route.post('/register', controller.register);
route.post('/login', createLimiter('userLogin', 100), controller.login);
route.patch('/profile', passportUserJwt, controller.changeProfile);
route.get('/profile', passportUserJwt, controller.getProfile);
route.post('/otp/request', createLimiter('userOTPRequest', 3), controller.requestUserOtp);
route.post('/otp/check', createLimiter('userOTPCheck', 3), controller.checkOtpMatched); // untuk sekedar check OTP dengan OTP database
route.post('/verify-email', controller.verifyUserEmailByOtp); // ganti nama endpoint buat menjiwai
route.post('/google', createLimiter('userGoogleAuth', 5), controller.handleGoogleAuth);
// NOTE BUAT FRONTEND:
// panggil OTP request dulu
// biar user tau kalo otp yang diinput bener, panggil /otp/check
// jadi form ada dua, form untuk isi otp dan form untuk input password baru (beda page)
// Kode OTP kirim sekalian dg field password baru
route.post('/reset-password', userOptionalAuth, controller.resetPassword);
route.post('/refresh', controller.refresh); // reject expired refresh token
route.post('/logout', passportUserJwt, controller.logout);
route.get('/me', passportUserJwt, controller.authMe); // buat cek session

module.exports = route;