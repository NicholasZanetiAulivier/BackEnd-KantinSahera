const express = require('express');
const controller = require('./controller');
const { passportAdminJwt } = require('../../middlewares/authentication');

const route = express.Router();

route.get('/', controller.getMenu);
route.patch('/:id', passportAdminJwt, controller.editMenu);
route.delete('/:id', passportAdminJwt, controller.deleteMenu);
route.post('/', passportAdminJwt, controller.createMenu);

module.exports = route;