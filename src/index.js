const express = require('express');
const server = require("./core/server");
const config = require('./core/config')

const app = express();
server(app);

app.listen(config.api.port || 1982);

console.log(`\nServer URL: localhost:${config.api.port || 1982}/api`)

module.exports = app;