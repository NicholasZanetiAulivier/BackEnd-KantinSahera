const cors = require('cors');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const pinoHTTP = require('pino-http');

const config = require('./config');
const logger = require('./logger')('app');
const router = require('../components/routes');
const { errorResponder, errors } = require('./errors');
const compression = require('compression');

module.exports = (app) => {

    app.enable('trust proxy');

    app.use(cors());

    app.use(methodOverride('_method'));

    app.use(bodyParser.json({ limit: '20mb' }));

    app.use(bodyParser.urlencoded({ extended: false }));

    app.use(pinoHTTP({
        logger,
        serializers: {
            req: (req) => ({
                method: req.method,
                url: req.url,
            }),
            res: (res) => ({
                code: res.statusCode,
            }),
        }
    }));

    app.use(compression());

    //Main Router
    app.use(config.api.prefix, router);

    //404 not found
    app.use((req, res, next) => {
        return next(errorResponder(errors.ROUTE_NOT_FOUND, 'Route not found'));
    })

    // Error loggers
    app.use((error, request, response, next) => {
        const ctx = {
            code: error.code,
            status: error.status,
            description: error.description,
        };

        // If this error is thrown by our code execution, then also log the stack trace
        if (error.stack) {
            ctx.stack = error.stack;
        }

        logger.error(ctx, error.toString());

        return next(error);
    });

    //Error Response
    app.use((err, req, res, next) => {
        res.status(err.status || 500).json({
            statusCode: err.status || 500,
            error: err.code || 'UNKNOWN_ERROR',
            description: err.description || 'Unknown error',
            message: err.message || 'An error has occurred',
        });
    });
}