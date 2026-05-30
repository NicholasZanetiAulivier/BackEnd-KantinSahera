const express = require('express');
const controller = require('./controller');
const { passportAdminJwt, passportUserJwt, adminOrUser, isAccountVerified } = require('../../middlewares/authentication');

const route = express.Router();

//Carts
route.get('/cart/price', passportUserJwt, controller.getCartPrice);
route.get('/cart', passportUserJwt, controller.getCustomerCart);
route.post('/cart', passportUserJwt, controller.addCustomerCartItem);
route.patch('/cart/:menuid', passportUserJwt, controller.updateCustomerCartItem);
route.delete('/cart/:menuid', passportUserJwt, controller.deleteCustomerCartItem);
route.delete('/cart', passportUserJwt, controller.deleteCustomerCart);

route.post('/create', passportUserJwt, isAccountVerified, controller.createOrder);

route.post('/notifications/payments', controller.handleNonSnapDokuNotifications);
//We might want to whitelist this, but we can easily check validity even without whitelisting
//I think notification is vulnerable to man in the middle attacks, but of course so is every other route

route.get('/user/:id', adminOrUser, controller.getOrderByUserID); // maybe make this more secure, but what are the chances anyone would know the specific order id of someone else's
route.get('/:id', adminOrUser, controller.getOrderByID); // maybe make this more secure, but what are the chances anyone would know the specific order id of someone else's
route.get('/', passportAdminJwt, controller.getOrders);

module.exports = route;