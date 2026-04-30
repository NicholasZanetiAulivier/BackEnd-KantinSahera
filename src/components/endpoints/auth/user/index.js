const express = require('express');
const controller = require('./controller');
const { passportUserJwt } = require('../../../middlewares/authentication');

const route = express.Router();

route.post('/register', controller.register);
route.post('/login', controller.login);
route.patch('/change-profile', passportUserJwt, controller.changeProfile);

module.exports = route;