const fs = require('fs');

const { loadEnvFile } = require('node:process');
loadEnvFile('.env');
process.env.NODE_ENV = (process.env.NODE_ENV || 'development').toLowerCase();
module.exports = {
    name: 'Kirno-API',
    pino_level: process.env.PINO_LEVEL,
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
        google_client_secret: process.env.GOOGLE_CLIENT_SECRET, // gak dipakai
        doku_client_id: process.env.DOKU_CLIENT_ID,
        doku_secret_key: process.env.DOKU_SECRET_KEY,
        doku_api_key: process.env.DOKU_API_KEY,
        doku_public_key: process.env.DOKU_PUBLIC_KEY,
    },
    admin_account: {
        email: process.env.ADMIN_ACCOUNT_EMAIL,
        password: process.env.ADMIN_ACCOUNT_PASSWORD
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
    },
    otp_time: 10, // 10 menit
    base_url: {
        frontend_admin: process.env.FE_ADMIN_BASE_URL,
        frontend_user: process.env.FE_USER_BASE_URL,
        frontend_another_user: process.env.FE_ANOTHER_USER_BASE_URL,
        backend: process.env.BE_BASE_URL,
        doku_api: process.env.DOKU_API || "https://api-sandbox.doku.com",
    },
    cloudinary: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        upload_folder: process.env.CLOUDINARY_UPLOAD_FOLDER,
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
    }
};
