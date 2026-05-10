const express = require('express');
const controller = require('./controller');
const { passportAdminJwt, passportUserJwt } = require('../../middlewares/authentication');

const route = express.Router();

//Carts
route.get('/cart/price', passportUserJwt, controller.getCartPrice);
route.get('/cart/', passportUserJwt, controller.getCustomerCart);
route.post('/cart/', passportUserJwt, controller.addCustomerCartItem);
route.patch('/cart/:menuid', passportUserJwt, controller.updateCustomerCartItem);
route.delete('/cart/:menuid', passportUserJwt, controller.deleteCustomerCartItem);
route.delete('/cart/', passportUserJwt, controller.deleteCustomerCart);

route.post('/create', passportUserJwt, controller.createOrder);

module.exports = route;