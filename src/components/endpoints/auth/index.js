const express = require('express');

const userAuthRouter = require('./user/index');

const route = express.Router();

// why am i doing this? because your fs wont read nested folders
route.use('/user', userAuthRouter);

module.exports = route;