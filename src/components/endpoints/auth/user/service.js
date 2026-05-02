const repository = require('./repository');
const {OAuth2Client} = require('google-auth-library');
const config = require('../../../../core/config');
const logger = require('../../../../core/logger')('user-service');
const {errors, errorResponder} = require('../../../../core/errors');

// per platform harus beda client, cuma sekarang kita web doang
const client = new OAuth2Client(config.secret.google_client_id);

// https://developers.google.com/identity/gsi/web/guides/verify-google-id-token#node.js
// untuk bentuk payload google bisa tengok: 
// https://developers.google.com/identity/sign-in/web/backend-auth#calling-the-tokeninfo-endpoint
async function verifyGoogleIdToken(token) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: config.secret.google_client_id,  // Specify the WEB_CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
        });
        const payload = ticket.getPayload();
        // logger.info({payload});
        // This ID is unique to each Google Account, making it suitable for use as a primary key
        // during account lookup. Email is not a good choice because it can be changed by the user.
        const userid = payload['sub'];
        // If the request specified a Google Workspace domain:
        // const domain = payload['hd'];

        const email = payload['email'];
        const name = payload['name'];
        const picture = payload['picture'];

        const emailVerified = String(payload['email_verified']);

        if (emailVerified !== "true") {
            throw errorResponder(errors.GOOGLE_ACCOUNT_UNVERIFIED, 
                "Akun Google Anda belum terverifikasi dari sistem Google!")
        }

        // cek client id apakah sama dg config server
        // google client id sebenarnya id publik tapi w bikin dia env aja
        // https://developers.google.com/identity/sign-in/web/backend-auth
        if (payload['aud'] !== config.secret.google_client_id) {
            throw errorResponder(errors.INVALID_CLIENT, "Client tidak valid!");
        }

        return { google_id: userid, email, name, picture };
    } catch (err) {
        logger.error({err}, "Gagal memverifikasi id token Google pengguna!");
        throw err;
    }
}

async function findByEmail(email) {
    const res = await repository.findByEmail(email);

    return res.rows[0];
}

async function createUser(user) {
    const { username, email, phone_no, passwordHash } = user;

    const res = await repository.createUser(username, email, phone_no, passwordHash);

    return res;
}

async function changeProfileWhereId(user) {
    const { username, profile_image_url, phone_number, user_id } = user;

    const res = await repository.changeProfileWhereId({ username, profile_image_url, phone_no: phone_number }, user_id);

    return res;
}

async function getProfileById(id) {
    const res = await repository.getProfileById(id);

    return res.rows[0];
}

module.exports = {
    findByEmail,
    createUser,
    changeProfileWhereId,
    getProfileById,
    verifyGoogleIdToken,
}