const express = require('express');
const controller = require('./controller');
const { passportAdminJwt } = require('../../middlewares/authentication');

const route = express.Router();

route.patch('/:id', passportAdminJwt, controller.editMenu);
route.post('/', passportAdminJwt, controller.createMenu);

module.exports = route;