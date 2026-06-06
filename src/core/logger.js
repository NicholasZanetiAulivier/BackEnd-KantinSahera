const pino = require('pino');
const config = require('./config')

// Print the log to STDOUT with colors and formatting for easier read
const pinoPretty = {
    target: 'pino-pretty',
    options: {
        colorize: true,
        crlf: true,
        translateTime: 'SYS:standard',
    },
};

// prod settings, kalo pino pretty ntar server meledak
// if env production, use this
const pinoProd = {
    target: 'pino/file',      // file — permanent record
    options: { destination: './logs/app.log', mkdir: true },
    level: config.pino_level || 'error' // save info and above to file


}

const isProduction = process.env.NODE_ENV === 'production';
const activeTransport = isProduction ? pinoProd : pinoPretty;

const logger = pino({
    name: config.name,
    formatters: {
        // Specify the level name instead of its integer value.
        level: (label) => ({
            level: label.toUpperCase(),
        }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    level: config.pino_level || 'error',
    redact: {
        paths: ['req.headers.authorization', 'headers.authorization', 'authorization', 'password', '*.password', 'token', 'auth'],
        censor: '[REDACTED]',
    },
},
    pino.transport(activeTransport)
);

module.exports = {
    logger,
}

