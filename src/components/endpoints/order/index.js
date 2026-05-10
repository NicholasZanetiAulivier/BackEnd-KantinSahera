const express = require('express');
const controller = require('./controller');
const { passportAdminJwt, passportUserJwt } = require('../../middlewares/authentication');

const route = express.Router();

//Carts
route.post('/cart/:id', passportUserJwt, controller.addCustomerCartItem);
route.get('/cart/:id', passportUserJwt, controller.getCustomerCart);

module.exports = route;