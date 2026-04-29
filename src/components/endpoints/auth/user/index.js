const express = require('express');
const controller = require('./controller');

const route = express.Router();

route.post('/register', controller.register);
route.post('/login', controller.login);

module.exports = route;