const express = require('express');
const server = require("./core/server");
const config = require('./core/config')

const app = express();
server(app);

const host = "127.0.0.1";

app.listen(config.api.port || 1982, host);

console.log(`\nServer URL: ${host}:${config.api.port || 1982}/api`)

module.exports = app;
