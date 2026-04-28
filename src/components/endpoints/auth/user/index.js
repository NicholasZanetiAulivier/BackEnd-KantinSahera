const express = require('express');
const controller = require('./controller');

const route = express.Router();

route.post('/register', controller.register);

module.exports = route;