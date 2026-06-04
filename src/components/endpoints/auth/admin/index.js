const express = require('express');
const controller = require('./controller');
const { passportSuperJwt, passportAdminJwt, adminOptionalAuth } = require('../../../middlewares/authentication');
const { createLimiter } = require('../../../middlewares/limiter');

const route = express.Router();

route.post('/create', passportSuperJwt, controller.register); //Admin cuma boleh dibuat oleh super admin
route.post('/login', createLimiter('adminLogin', 5), controller.login);
route.post('/otp/request', createLimiter('adminOTPRequest', 3), controller.requestAdminOtp);
route.post('/otp/check', createLimiter('adminOTPCheck', 3), controller.checkOtpMatched);
route.post('/verify-email', controller.verifyAdminEmailByOtp);
// TO-DO: Invalidate current jwt, jika endpoint reset password diakses saat kondisi login 
route.post('/reset-password', adminOptionalAuth, controller.resetPassword);
route.post('/refresh', controller.refresh);
route.post('/logout', controller.logout);
// Kelola admin — super admin only
route.get('/', passportSuperJwt, controller.getAdmins);
route.patch('/:id', passportSuperJwt, controller.editAdmin);
route.delete('/:id', passportSuperJwt, controller.deleteAdmin);
route.get('/me', passportAdminJwt, controller.authMe);

module.exports = route;