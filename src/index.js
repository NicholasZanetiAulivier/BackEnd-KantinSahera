const express = require('express');
const server = require("./core/server");

const app = express();
server(app);

app.listen(process.env.APP_PORT || 1982);

module.exports = app;