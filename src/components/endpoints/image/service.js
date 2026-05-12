const cloudinary = require('cloudinary').v2;
const config = require('../../../core/config');

const CLOUDINARY_CLOUD_NAME = config.cloudinary.cloud_name || "";
const CLOUDINARY_API_KEY = config.cloudinary.api_key || "";
const CLOUDINARY_API_SECRET = config.cloudinary.api_secret || "";
const CLOUDINARY_UPLOAD_FOLDER = config.cloudinary.upload_folder || "";
const CLOUDINARY_UPLOAD_PRESET = config.cloudinary.upload_preset || "";

async function generateCloudinarySignature(params = null) {
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
    });

    // Every signature is parametrized for the specific upload needed
    const paramsToSign = {
        folder: CLOUDINARY_UPLOAD_FOLDER, // The folder to upload the image to
        timestamp: Math.floor(new Date().getTime() / 1000), // Unix timestamp in seconds
        source: 'uw',
        upload_preset: CLOUDINARY_UPLOAD_PRESET,
        unique_filename: true,
    };

    // Call the Cloudinary SDK to sign the parameters
    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        CLOUDINARY_API_SECRET,
    );

    // All of the following properties are needed on the frontend to perform the upload
    return {
        signature: signature,
        timestamp: paramsToSign.timestamp,
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
    };
}

module.exports = {
    generateCloudinarySignature,
}