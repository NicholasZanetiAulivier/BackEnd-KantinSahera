const config = require("../core/config");
const { minify } = require('@node-minify/core');
const { jsonMinify } = require('@node-minify/jsonminify')
const crypto = require('crypto');

const DOKU_PRIVATE_KEY = config.secret.doku_secret_key;
const DOKU_CLIENT_ID = config.secret.doku_client_id;
const API_URL = config.base_url.doku_api;

async function preAsymmetricSignTransaction(body, httpMethod, target, timestamp) {
    // Minify json request body
    const json = JSON.stringify(body);
    const minified = minify({
        compressor: jsonMinify,
        content: json
    });
    console.log(minified); // Works

    // Encrypt minified into SHA 256 Hex
    const hashedMinified = crypto.createHash('sha256').update(minified).digest('hex').toLowerCase();

    //Get String to sign
    const stringToSign = httpMethod + ":" + target + ":" + hashedMinified + ":" + timestamp;

    //Generate Assymetric signature
    const sign = crypto.createSign('SHA256');
    sign.write(stringToSign);
    sign.end();
    const signature = sign.sign(config.secret.ssl_private_key, 'base64');

    return signature;
}

async function preAsymmetricSignToken(timestamp) {
    const stringToSign = DOKU_CLIENT_ID + "|" + timestamp;
    console.log(stringToSign)

    //Generate Assymetric signature
    const sign = crypto.createSign('SHA256');
    sign.write(stringToSign);
    sign.end();
    const signature = sign.sign(config.secret.ssl_private_key, 'base64');
    
    return signature;
}

async function B2BGetToken(signature, timestamp) {
    const headers = new Headers({
        "X-SIGNATURE": signature,
        "X-TIMESTAMP": timestamp,
        "X-CLIENT-KEY": DOKU_CLIENT_ID,
        "Content-Type": "application/json",
    });

    // console.log('B2B TOKEN REQUEST HEADERS')
    // console.log('passed signature ', signature); // UNDEFINED
    // console.log(timestamp);
    // console.log(DOKU_CLIENT_ID);

    const body = {
        "grantType": "client_credentials"
    };

    console.log(`${API_URL}/authorization/v1/access-token/b2b`)

    const response = await fetch(
        API_URL + "/authorization/v1/access-token/b2b", {
        method: "POST",
        headers,
        body: JSON.stringify(body)
    }).then(async res => {
        return res.json();
    })
    console.log(response)
}

module.exports = {
    preAsymmetricSignTransaction,
    preAsymmetricSignToken,
    B2BGetToken,
}