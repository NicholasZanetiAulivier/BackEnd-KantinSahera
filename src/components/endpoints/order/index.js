const express = require('express');
const controller = require('./controller');
const { passportAdminJwt, passportUserJwt } = require('../../middlewares/authentication');

const route = express.Router();

//Carts
route.get('/cart/:id', passportUserJwt, controller.getCustomerCart);
route.post('/cart/:id', passportUserJwt, controller.addCustomerCartItem);
route.patch('/cart/:id/:menuid', passportUserJwt, controller.updateCustomerCartItem);
route.delete('/cart/:id/:menuid', passportUserJwt, controller.deleteCustomerCartItem);

module.exports = route;