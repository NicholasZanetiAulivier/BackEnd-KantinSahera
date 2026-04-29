const express = require('express');
const server = require("./core/server");
const config = require('./core/config')

const app = express();
server(app);

app.listen(config.api.port || 1982);

module.exports = app;