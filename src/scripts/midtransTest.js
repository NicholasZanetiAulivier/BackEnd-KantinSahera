const express = require('express');
const config = require('../core/config');
const cors = require('cors');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const pinoHTTP = require('pino-http');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { logger } = require('../core/logger');
const readline = require('readline');
const { errorResponder, errors } = require('../core/errors');

//Express server to handle notification

const app = express();
app.use(cors());
app.use(methodOverride('_method'));
app.use(cookieParser());
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

//Notification callback request
app.use('/api/notification', (req, res, next) => {
    console.log(req.body);
});

app.use((req, res, next) => {
    return next(errorResponder(errors.ROUTE_NOT_FOUND, 'Route not found'));
})
app.use((error, request, response, next) => {
    const ctx = {
        code: error.code,
        status: error.status,
        description: error.description,
    };

    logger.error({ err: error, ...ctx });

    return next(error);
});
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        statusCode: err.status || 500,
        error: err.code || 'UNKNOWN_ERROR',
        description: err.description || 'Unknown error',
        message: err.message || 'An error has occurred',
    });
});

//Helper function to wait for setup
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

//Transaction data MIDTRANS PART
const transaction_details = {
    "order_id": "FJ93qj8BU123c",
    "gross_amount": 40_000,
}

const headers = new Headers({
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": "Basic " + config.secret.midtrans_auth_string
});

async function main() {
    app.listen(config.api.port || 1982);
    //Change order id to random string
    //Run
    //ssh -R 80:localhost:<PORT> localhost.run 
    //Add the given url/api/notification to midtrans notification URL
    //Then type anything in cmd
    //Then click on given redirect_url and test payment
    //Thingy should call the callback function through the api on error, update, or success
    await askQuestion("Have you setup the internet accessible URL?");
    const results = await fetch(
        'https://app.sandbox.midtrans.com/snap/v1/transactions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ transaction_details })
    }
    );

    console.log(await results.json());

}

main()