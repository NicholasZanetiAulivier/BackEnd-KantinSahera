const express = require('express');
const controller = require('./controller');
const { passportSuperJwt } = require('../../../middlewares/authentication');
const { createLimiter } = require('../../../middlewares/limiter');

const route = express.Router();

route.post('/create', passportSuperJwt, controller.register); //Admin cuma boleh dibuat oleh super admin
route.post('/login', createLimiter('adminLogin', 5), controller.login);
route.post('/otp/request', createLimiter('adminOTPRequest', 3), controller.requestAdminOtp);
route.post('/otp/check', createLimiter('adminOTPCheck', 3), controller.checkOtpMatched);
route.post('/verify-email', controller.verifyAdminEmailByOtp);
route.post('/reset-password', controller.resetPassword);

module.exports = route;