const fs = require('fs');

process.env.NODE_ENV = (process.env.NODE_ENV || 'development').toLowerCase();
const { loadEnvFile } = require('node:process');
loadEnvFile('.env');
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
        midtrans_server_key: process.env.SERVER_KEY,
        midtrans_auth_string: btoa(process.env.SERVER_KEY + ":"),
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
        backend: process.env.BE_BASE_URL
    },
    cloudinary: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        upload_folder: process.env.CLOUDINARY_UPLOAD_FOLDER,
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
    }
};
