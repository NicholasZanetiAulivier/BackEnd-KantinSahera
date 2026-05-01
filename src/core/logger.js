const pino = require('pino');

// Print the log to STDOUT with colors and formatting for easier read
const pinoPretty = {
    target: 'pino-pretty',
    options: {
        colorize: true,
        crlf: true,
        translateTime: 'SYS:standard',
    },
};

module.exports = (appName) =>
    pino(
        {
            name: appName,
            formatters: {
                // Specify the level name instead of its integer value.
                level: (label) => ({
                    level: label.toUpperCase(),
                }),
            },
            timestamp: pino.stdTimeFunctions.isoTime,
            level: 'info',
            redact: {
                paths: ['password', '*.password', 'token', 'auth'],
                censor: '[REDACTED]',
            },
        },
        pino.transport(pinoPretty)
    );
