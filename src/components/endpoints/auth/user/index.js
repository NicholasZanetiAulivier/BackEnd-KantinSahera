const express = require('express');
const controller = require('./controller');
const { passportUserJwt } = require('../../../middlewares/authentication');

const route = express.Router();

route.post('/register', controller.register);
route.post('/login', controller.login);
route.patch('/profile', passportUserJwt, controller.changeProfile);
route.get('/profile', passportUserJwt, controller.getProfile);
route.post('/otp/request', controller.requestUserOtp);
route.post('/otp', controller.verifyUserEmailByOtp);
route.post('/google', controller.handleGoogleAuth);

module.exports = route;