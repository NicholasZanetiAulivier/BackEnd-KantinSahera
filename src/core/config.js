const fs = require('fs');

process.env.NODE_ENV = (process.env.NODE_ENV || 'development').toLowerCase();
const { loadEnvFile } = require('node:process');
loadEnvFile('.env');
module.exports = {
    env: process.env.NODE_ENV,
    api: {
        prefix: '/api',
        port: process.env.APP_PORT || 5000,
        name: process.env.APP_NAME || "API",
    },
    secret: {
        user: process.env.USER_SECRET_KEY,
        admin: process.env.ADMIN_SECRET_KEY,
        google_client_id: process.env.GOOGLE_CLIENT_ID,
        google_client_secret: process.env.GOOGLE_CLIENT_SECRET
    },
    database: {
        user: process.env.USER,
        password: process.env.PASSWORD,
        host: process.env.HOST,
        port: process.env.PORT,
        name: process.env.DATABASE,
        certificate: fs.existsSync('./ca.pem') ? fs.readFileSync('./ca.pem').toString() : process.env.CA_PEM,
        // connectionString: process.env.CONNECTION_STRING,
        ssl: process.env.SSL_REQUIRE == 1 ? true : false,
    },
    keys_prefix: {
        user_id: 'user-',
        admin_id: 'admin-'
    },
    otp_sender: {
        host: process.env.STMP_HOST,
        email: process.env.STMP_USER,
        password: process.env.STMP_PASS,
    }
};
