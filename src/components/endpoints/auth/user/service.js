const repository = require('./repository');
const { OAuth2Client } = require('google-auth-library');
const config = require('../../../../core/config');
const { logger } = require('../../../../core/logger');
const tokenService = require('../token/service');
const { errors, errorResponder } = require('../../../../core/errors');
const { generateUserJwt, refreshUserJwt } = require('../../../../utils/token');
const jwt = require('jsonwebtoken');
const { parseUserId } = require('../../../../utils/id-parser');
const { compareOpaqueStringHash } = require('../../../../utils/password');
const { compare } = require('bcrypt');

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

        return { google_id: userid, username: name, email, profile_image_url: picture };
    } catch (err) {
        logger.error({ err }, "Gagal memverifikasi id token Google pengguna!");
        throw errorResponder(errors.INVALID_TOKEN, "Gagal mengvalidasi token!");
    }
}

async function findById(user_id) {
    const res = await repository.findById(user_id);

    return res.rows[0];
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

async function handleGoogleAuth(googlePayload) {
    const status = {
        register: 'Anda berhasil membuat akun dengan Google!',
        login: 'Berhasil login dengan Google!',
        bind: 'Berhasil mengaitkan akun yang telah ada dengan akun Google!'
    };

    const accountExists = await repository.findByEmail(googlePayload.email);

    let db = accountExists.rows[0];

    let returnMessage;
    let user = {}

    // kasus akun belum ada, maka accountExists undefined
    if (!db) {
        db = {
            google_id: 'KOSONG'
        }
    }

    // kasus returning user (user sudah sign in dengan google sebelumnya)
    // bandingkan sub id (google_id) di db dg sub claim di payload
    if (db.google_id === googlePayload.google_id) {
        user = db;

        returnMessage = status['login'];
    } else {
        // register atau bind akun
        const result = await repository.createOrUpsertGoogleUser(googlePayload);

        user = result.rows[0];

        if (user.is_updated) returnMessage = status['bind'];
        else returnMessage = status['register'];
    }

    const token = await generateUserJwt({
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        verified: user.verified,
        profile_image_url: user.profile_image_url
    });

    if (!token) {
        throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Proses login gagal!");
    }

    // return non-prefixed account id for refresh token issuing purposes
    return { message: returnMessage, token: token, user_id: user.user_id }
}

async function refreshAccessToken(accessToken, refreshToken) {
    let payload = decodeUserPayload(accessToken);

    // fallback measures
    if (!payload) payload = jwt.decode(accessToken);

    const splittedRefreshToken = refreshToken.split('.');
    const refreshId = splittedRefreshToken[0];
    const opaqueStr = splittedRefreshToken[1];

    const data = await repository.findById(parseUserId(payload.user_id));
    const user = data.rows[0];

    if (!user) throw errorResponder(errors.NOT_FOUND, "User tidak ditemukan!");

    await tokenService.verifyRefreshToken(refreshId, opaqueStr, user.user_id, false);

    const newAccessToken = await generateUserJwt(user);

    if (!newAccessToken) throw errorResponder(errors.INTERNAL_SERVER_ERROR, "Terjadi error pada saat proses refresh token!");

    return {
        accessToken: newAccessToken,
        userId: user.user_id,
    };
}

function decodeUserPayload(accessToken) {
    let payload;
    jwt.verify(accessToken, config.secret.user, (err, decoded) => {
        if (err) {
            // bolehkan jwt yg expired, karena tujuan kita generate access token baru (jwt baru)
            if (err.name === 'TokenExpiredError') {
                payload = jwt.decode(accessToken);
            }
            else {
                logger.error({ err }, "Terjadi error saat validasi token refresh!");
                throw errorResponder(errors.INVALID_TOKEN, "Token yang diberikan tidak valid!");
            }
        }

        payload = decoded;
    });

    return payload;
}

module.exports = {
    findByEmail,
    findById,
    createUser,
    changeProfileWhereId,
    getProfileById,
    verifyGoogleIdToken,
    handleGoogleAuth,
    refreshAccessToken,
    decodeUserPayload,
}