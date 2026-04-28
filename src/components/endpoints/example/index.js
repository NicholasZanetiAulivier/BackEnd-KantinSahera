const express = require('express');
const controller = require('./controller');

const route = express.Router();

route.get('/hello', controller.hello);

module.exports = route;