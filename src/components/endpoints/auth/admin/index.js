const express = require('express');
const controller = require('./controller');
const { passportSuperJwt, passportAdminJwt } = require('../../../middlewares/authentication');
const { createLimiter } = require('../../../middlewares/limiter');

const route = express.Router();

route.post('/create', passportSuperJwt, controller.register); //Admin cuma boleh dibuat oleh super admin
route.post('/login', createLimiter('adminLogin', 5), controller.login);
route.post('/otp/request', createLimiter('adminOTPRequest', 3), controller.requestAdminOtp);
route.post('/otp/check', createLimiter('adminOTPCheck', 3), controller.checkOtpMatched);
route.post('/verify-email', controller.verifyAdminEmailByOtp);
// TO-DO: Invalidate current jwt, jika endpoint reset password diakses saat kondisi login 
route.post('/reset-password', controller.resetPassword);
route.post('/refresh', passportAdminJwt, controller.refreshToken);
route.post('/logout', passportAdminJwt, controller.logout);

module.exports = route;