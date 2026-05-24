const cors = require('cors');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const pinoHTTP = require('pino-http');
const config = require('./config');
const {logger} = require('./logger');
const router = require('../components/routes');
const { errorResponder, errors } = require('./errors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { globalLimiterMinute } = require('../components/middlewares/limiter');

module.exports = (app) => {

    // app.enable('trust proxy');
    // Trust proxy gak compatible dengan IP based rate limiting, karena bisa di bypass

    app.use(cors({
        origin: [
            config.base_url.frontend_user,
            config.base_url.frontend_admin
        ],
        credentials: true,
    }));
    // app.use(cors());

    app.use(methodOverride('_method'));

    // buat GSI
    app.use(cookieParser());

    app.use(bodyParser.json({ limit: '1mb' })); // ini gk kegedean?

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

    // to silence the 404 favicon.ico
    app.get('/favicon.ico', (req, res, next) => {
        return res.status(204).end();
    })

    app.use(globalLimiterMinute(1000));

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

        logger.error({err: error, ...ctx});

        return next(error);
    });

    //Error Response
    app.use((err, req, res, next) => {
        res.status(err.status || 500).json({
            statusCode: err.status || 500,
            error: err.code || 'UNKNOWN_ERROR',
            description: err.description || 'Unknown error',
            message: 'An error has occurred',
        });
    });
}