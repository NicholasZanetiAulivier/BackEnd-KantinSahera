const express = require('express');
const controller = require('./controller');
const { passportSuperJwt } = require('../../../middlewares/authentication');
const { createLimitter } = require('../../../middlewares/limiter');

const route = express.Router();

route.post('/create', passportSuperJwt, controller.register); //Admin cuma boleh dibuat oleh super admin
route.post('/login', createLimiter('adminLogin', 5), controller.login);
route.post('/otp/request', createLimitter('adminOTPRequest', 3), controller.requestAdminOtp);
route.post('/otp/check', createLimitter('adminOTPCheck', 3), controller.checkOtpMatched);
route.post('/otp', controller.verifyAdminEmailByOtp);

module.exports = route;