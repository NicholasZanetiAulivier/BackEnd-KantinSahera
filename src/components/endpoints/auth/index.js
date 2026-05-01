const express = require('express');

const userAuthRouter = require('./user');
const adminAuthRouter = require('./admin');
const verificationRouter = require('./verify');

const route = express.Router();

route.use('/user', userAuthRouter);
route.use('/admin', adminAuthRouter);
route.use('/verify', verificationRouter);

module.exports = route;