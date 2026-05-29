const express = require('express');
const controller = require('./controller');
const { passportAdminJwt } = require('../../middlewares/authentication');

const route = express.Router();

route.put('/', passportAdminJwt, controller.updateRestaurantData);

route.put('/status', passportAdminJwt, controller.setRestaurantStatus);
route.get('/status', controller.getRestaurantStatus);
route.get('/', controller.getRestaurantData);


module.exports = route;