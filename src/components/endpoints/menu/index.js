const express = require('express');
const controller = require('./controller');
const { passportAdminJwt } = require('../../middlewares/authentication');

const route = express.Router();

route.post('/', passportAdminJwt, controller.createMenu);

module.exports = route;