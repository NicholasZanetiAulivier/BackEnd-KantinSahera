const express = require('express');
const controller = require('./controller');
const { adminOrUser } = require('../../middlewares/authentication');

const route = express.Router();

// method bisa berubah post atau get, tergantung implementasi di next js nanti
route.get('/sign-upload', adminOrUser, controller.createSignature);

module.exports = route;