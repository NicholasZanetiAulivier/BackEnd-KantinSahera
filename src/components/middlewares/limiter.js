const ERT = require('express-rate-limit');
const postgresStores = require('@acpr/rate-limit-postgresql')
const config = require('../../core/config');
const {logger} = require('../../core/logger');
const { errorMonitor } = require('nodemailer/lib/xoauth2');
const { errorResponder, errors } = require('../../core/errors');

let configs = {
    user: config.database.user,
    password: config.database.password,
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    // connectionString: config.database.connectionString,
    ssl: config.database.ssl ? {
        rejectUnauthorized: true,
        ca: config.database.certificate,
    } : null,
}

if (config.database.connectionString) {
    configs = {
        connectionString: config.database.connectionString
    }
}

const CONNECTION_CONFIGURATION = configs

const createLimiter = (prefix = "", requestLimit = 3) => ERT.rateLimit({
    windowMs: 60000 * 60, // sejam
    limit: requestLimit,
    legacyHeaders: false, // rekomendasi Docs nya
    standardHeaders: true,
    store: new postgresStores.PostgresStore(CONNECTION_CONFIGURATION, prefix),
    ipv6Subnet: 56, // Default, ubah kalo perluh,
    logger: logger,
    handler: (req, res, next) => {
        return next(errorResponder(errors.TOO_MANY_REQUEST, "Terlalu banyak percobaan, silakan coba lagi nanti!"));
    }
})

// default ke 100 RPM
const globalLimiterMinute = (requestLimit = 100) => ERT.rateLimit({
    windowMs: 1000 * 60, 
    limit: requestLimit,
    legacyHeaders: false, // rekomendasi Docs nya
    standardHeaders: true,
    store: new postgresStores.PostgresStore(CONNECTION_CONFIGURATION, "global-rpm"),
    ipv6Subnet: 56, // Default, ubah kalo perluh,
    logger: logger,
    handler: (req, res, next) => {
        return next(errorResponder(errors.TOO_MANY_REQUEST));
    }
})

module.exports = {
    createLimiter,
    globalLimiterMinute
}