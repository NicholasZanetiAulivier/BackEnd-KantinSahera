const express = require('express');
const fs = require('fs');
const path = require('path');

const endpoints = path.join(__dirname, 'endpoints');
const names = fs.readdirSync(endpoints);
const router = express.Router();

for (const i of names) {
    const temp = path.join(endpoints, i);
    const subRouter = require(temp);
    router.use(`/${i}`, subRouter);
}


module.exports = router;