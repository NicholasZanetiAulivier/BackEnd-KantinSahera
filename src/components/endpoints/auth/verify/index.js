const express = require('express');
const controller = require('./controller');

const route = express.Router();

route.post('/otp/request', controller.requestOTP);
route.post('/otp', controller.verifyOTP);

module.exports = route;