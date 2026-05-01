const express = require('express');

const userAuthRouter = require('./user');
const adminAuthRouter = require('./admin');

const route = express.Router();

route.use('/user', userAuthRouter);
route.use('/admin', adminAuthRouter);

module.exports = route;