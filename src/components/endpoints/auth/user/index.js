const express = require('express');
const controller = require('./controller');
const { passportUserJwt } = require('../../../middlewares/authentication');
const { createLimitter } = require('../../../middlewares/limiter');

const route = express.Router();

route.post('/register', controller.register);
route.post('/login', controller.login);
route.patch('/profile', passportUserJwt, controller.changeProfile);
route.get('/profile', passportUserJwt, controller.getProfile);
route.post('/otp/request', createLimitter('userOTPRequest'), controller.requestUserOtp);
route.post('/otp/check', createLimitter('userOTPCheck'), controller.checkOtpMatched); // untuk sekedar check OTP dengan OTP database
route.post('/otp', controller.verifyUserEmailByOtp); // ini bisa ganti nama jadi set-verified (biar lebih menjelaskan fungsi)
route.post('/google', controller.handleGoogleAuth);
// NOTE BUAT FRONTEND:
// panggil OTP request dulu
// biar user tau kalo otp yang diinput bener, panggil /otp/check
// jadi form ada dua, form untuk isi otp dan form untuk input password baru (beda page)
// Kode OTP kirim sekalian dg field password baru
route.post('/reset-password', controller.resetPassword);

module.exports = route;