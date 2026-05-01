const express = require('express');
const controller = require('./controller');
const { passportSuperJwt } = require('../../../middlewares/authentication');

const route = express.Router();

route.post('/create', passportSuperJwt, controller.register); //Admin cuma boleh dibuat oleh super admin
route.post('/login', controller.login);
route.post('/otp/request', controller.requestAdminOtp);
route.post('/otp', controller.verifyAdminOtp);

module.exports = route;