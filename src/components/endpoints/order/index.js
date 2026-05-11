const express = require('express');
const controller = require('./controller');
const { passportAdminJwt, passportUserJwt, userOptionalAuth, adminOptionalAuth } = require('../../middlewares/authentication');

const route = express.Router();

//Carts
route.get('/cart/price', passportUserJwt, controller.getCartPrice);
route.get('/cart/', passportUserJwt, controller.getCustomerCart);
route.post('/cart/', passportUserJwt, controller.addCustomerCartItem);
route.patch('/cart/:menuid', passportUserJwt, controller.updateCustomerCartItem);
route.delete('/cart/:menuid', passportUserJwt, controller.deleteCustomerCartItem);
route.delete('/cart/', passportUserJwt, controller.deleteCustomerCart);

route.post('/create', passportUserJwt, controller.createOrder);

route.get('/user/:id', userOptionalAuth, adminOptionalAuth, controller.getOrderByUserID); // maybe make this more secure, but what are the chances anyone would know the specific order id of someone else's
route.get('/:id', controller.getOrderByID); // maybe make this more secure, but what are the chances anyone would know the specific order id of someone else's
route.get('/', passportAdminJwt, controller.getOrders); // Currently only supports offset and limit queries, should probably be able to query for upaid, paid, and/or fullfilled orders

module.exports = route;