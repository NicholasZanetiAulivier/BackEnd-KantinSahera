const express = require('express');
const controller = require('./controller');
const { passportUserJwt } = require('../../../middlewares/authentication');

const route = express.Router();

route.post('/register', controller.register);
route.post('/login', controller.login);
route.patch('/profile', passportUserJwt, controller.changeProfile); // change-profile -> profile for best RESTful design
route.get('/profile', passportUserJwt, controller.getProfile);

module.exports = route;