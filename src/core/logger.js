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
    options: { destination: './app.log', mkdir: true },
    level: config.pino_level || 'info' // save info and above to file
}

const logger = pino({
    name: config.name,
    formatters: {
        // Specify the level name instead of its integer value.
        level: (label) => ({
            level: label.toUpperCase(),
        }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    level: config.pino_level || 'info',
    redact: {
        paths: ['password', '*.password', 'token', 'auth'],
        censor: '[REDACTED]',
    },
    },
    pino.transport(pinoPretty)
);

module.exports = {
    logger,
}
    
