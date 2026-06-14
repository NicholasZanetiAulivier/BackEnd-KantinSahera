const {
  errorResponder,
  errors,
  processJoiValidationError,
} = require("../../../../core/errors");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const validate = require("../../../middlewares/validator");
const service = require("./service");
const otpService = require("../verify/service");
const tokenService = require("../token/service");
const {
  hashPassword,
  passwordMatched,
  hashOpaqueString,
} = require("../../../../utils/password");
const {
  generateUserJwt,
  generateRefreshToken,
  REFRESH_TOKEN_EXPIRY_SECONDS,
  cookieOptions,
} = require("../../../../utils/token");
const { passportUserJwt } = require("../../../middlewares/authentication");
const { parseUserId } = require("../../../../utils/id-parser");
const config = require("../../../../core/config");
const jwt = require("jsonwebtoken");
const { addRefreshToken } = require("../token/repository");

cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Hanya file gambar yang diizinkan."));
    }
    cb(null, true);
  },
});

async function uploadProfileImage(req, res, next) {
  upload.single("profile_image")(req, res, async (err) => {
    try {
      if (err) return next(err);
      if (!req.file) {
        throw errorResponder(
          errors.BAD_REQUEST,
          "File gambar tidak ditemukan!",
        );
      }

      // upload ke cloudinary
      await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: config.cloudinary.upload_folder || "profile",
            // upload_preset: config.cloudinary.upload_preset,
            resource_type: "image",
          },
          (uploadErr, uploadRes) => {
            if (uploadErr) return reject(uploadErr);

            const secureUrl =
              uploadRes && uploadRes.secure_url ? uploadRes.secure_url : null;
            const url = uploadRes && uploadRes.url ? uploadRes.url : null;

            return res.status(200).json({
              profile_image_url: secureUrl || url,
            });
          },
        );

        uploadStream.end(req.file.buffer);
        return resolve();
      });
    } catch (e) {
      return next(e);
    }
  });
}

async function register(req, res, next) {
  try {
    const { error, value } = validate.register(req.body);
    processJoiValidationError(error);

    const { username, email, phone_number, password, confirm_password } = value;

    const emailExists = await service.findByEmail(email);

    if (emailExists) {
      throw errorResponder(errors.DB_DUPLICATE_CONFLICT, "Email sudah ada!");
    }

    const passwordHash = await hashPassword(password);

    const result = await service.createUser({
      username,
      email,
      phone_no: phone_number,
      passwordHash,
    });

    if (result.rowCount > 0)
      return res.status(201).json({ message: "Akun user berhasil dibuat." });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { error, value } = validate.login(req.body);
    processJoiValidationError(error);

    const { email, password } = value;

    let invalidField = null;

    const user = await service.findByEmail(email);

    if (!user) {
      throw errorResponder(
        errors.INVALID_CREDENTIALS,
        "Email atau kata sandi salah!",
      );
    }

    // generalisasikan error (ini kalo password database null, register lewat google)
    if (!user.password) {
      throw errorResponder(
        errors.INVALID_CREDENTIALS,
        "Email atau kata sandi salah!",
      );
    }

    const passwordValid = await passwordMatched(password, user.password);

    user.password = null;

    if (passwordValid) {
      // destructure object so only username and email is sent
      const token = await generateUserJwt(user);

      if (!token)
        throw errorResponder(
          errors.INTERNAL_SERVER_ERROR,
          "Terjadi error pada saat proses login!",
        );

      // uuid.opaquestr
      const refreshTokenStr = await tokenService.createRefreshToken(
        user.user_id,
        false,
      );

      if (!refreshTokenStr)
        throw errorResponder(
          errors.INTERNAL_SERVER_ERROR,
          "Terjadi error pada saat proses login!",
        );

      res.cookie("refresh_token", refreshTokenStr, cookieOptions);

      return res.status(200).json({ token: token });
    } else {
      throw errorResponder(
        errors.INVALID_CREDENTIALS,
        "Email atau kata sandi salah!",
      );
    }
  } catch (err) {
    return next(err);
  }
}

async function changeProfile(req, res, next) {
  try {
    const { error, value } = validate.profile(req.body);
    processJoiValidationError(error);

    const { username, profile_image_url, phone_number } = value;

    const id = parseUserId(req.user.user_id);

    const result = await service.changeProfileWhereId({
      username,
      profile_image_url,
      phone_number,
      user_id: id,
    });

    if (result.rowCount > 0) return res.status(204).end();
    else if (result.rowCount === 0)
      throw errorResponder(errors.NOT_FOUND, "Email yang diberikan tidak ada!");
  } catch (err) {
    return next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const id = parseUserId(req.user.user_id);

    const profile = await service.getProfileById(id);

    if (profile) return res.status(200).json(profile);
  } catch (err) {
    return next(err);
  }
}

async function requestUserOtp(req, res, next) {
  try {
    const { email } = req.body;

    const { error, value } = validate.email(email);

    processJoiValidationError(error);

    const user = await service.findByEmail(email);

    if (!user) {
      min = Math.ceil(1000);
      max = Math.floor(3000);
      const simulatedTime = Math.floor(Math.random() * (max - min + 1)) + min;

      setTimeout(() => {
        return res.status(202).json({
          message: "Permintaan OTP telah dikirim! Silakan cek email Anda.",
        });
      }, simulatedTime);
    }

    otpService.sendOTP(email, false);

    return res.status(202).json({
      message: "Permintaan OTP telah dikirim! Silakan cek email Anda.",
    });
    // if (mailed) return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

async function verifyUserEmailByOtp(req, res, next) {
  try {
    const { error, value } = validate.verifyOtp(req.body);

    processJoiValidationError(error);

    const { email, otp_code } = value;

    const user = await service.findByEmail(email);

    if (!user) return res.status(204).end();

    // lakukan pengecekan otp hash terlebih dahulu
    const valid = await otpService.verifyOTP(email, otp_code, false);

    if (valid) {
      const result = await otpService.markAccountAsVerified(email, false);

      if (result) return res.status(204).end();
    }
  } catch (err) {
    return next(err);
  }
}

// https://developers.google.com/identity/sign-in/web/backend-auth
// https://developers.google.com/identity/gsi/web/reference/html-reference
// https://developers.google.com/identity/gsi/web/guides/overview
async function handleGoogleAuth(req, res, next) {
  try {
    // credential = id token JWT dari Google (ngikut docs)
    const { credential } = req.body;

    const idTokenValid = await service.verifyGoogleIdToken(credential);

    const result = await service.handleGoogleAuth(idTokenValid);

    // code duplication i know, buat implementasi cepat aja
    const refreshTokenStr = await tokenService.createRefreshToken(
      result.user_id,
      false,
    );

    if (!refreshTokenStr)
      throw errorResponder(
        errors.INTERNAL_SERVER_ERROR,
        "Terjadi error pada saat proses login!",
      );

    // hapus refresh token lama
    res.clearCookie("refresh_token");
    res.cookie("refresh_token", refreshTokenStr, cookieOptions);

    return res.status(200).json(({ message, token } = result));
  } catch (err) {
    return next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { error, value } = validate.resetPassword(req.body);

    // const { jti } = req.user;

    processJoiValidationError(error);

    const { email, otp_code, password, confirm_password } = value;

    const user = await service.findByEmail(email);

    if (!user) return res.status(204).end();

    const valid = await otpService.verifyOTP(email, otp_code, false);

    if (valid) {
      // kirim plaintext password
      const result = await otpService.resetAccountPassword(
        email,
        password,
        false,
      );

      if (result) {
        // if (jti) await tokenService.invalidateJti(jti);

        // log out dari semua sesi saat password berhasil diubah
        await tokenService.clearRefreshTokens(user.user_id, false);

        res.clearCookie("refresh_token");

        return res.status(204).end();
      }
    }
  } catch (err) {
    return next(err);
  }
}

async function checkOtpMatched(req, res, next) {
  try {
    const { error, value } = validate.verifyOtp(req.body);
    processJoiValidationError(error);

    const { email, otp_code } = value;

    const user = await service.findByEmail(email);

    // generalisasikan error untuk mencegah account enumeration
    if (!user)
      throw errorResponder(
        errors.INVALID_CREDENTIALS,
        "OTP yang dimasukkan tidak sesuai!",
      );

    const valid = await otpService.verifyOTP(email, otp_code, false);

    if (valid) return res.status(204).end();
    else
      throw errorResponder(
        errors.INVALID_CREDENTIALS,
        "OTP yang dimasukkan tidak sesuai!",
      );
  } catch (err) {
    return next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const authorization = req.headers.authorization || " ";
    const authHeader = authorization.split(" ");

    if (!authHeader.includes("Bearer"))
      throw errorResponder(errors.UNAUTHORIZED);

    const refreshToken = req.cookies.refresh_token;
    const accessToken = authHeader[1] || "";

    if (!refreshToken)
      throw errorResponder(
        errors.UNAUTHORIZED,
        "Refresh token tidak ada atau tidak sesuai!",
      );

    const result = await service.refreshAccessToken(accessToken, refreshToken);

    // code duplication i know, buat implementasi cepat aja
    const refreshTokenStr = await tokenService.createRefreshToken(
      result.userId,
      false,
    );

    if (!refreshTokenStr)
      throw errorResponder(
        errors.INTERNAL_SERVER_ERROR,
        "Terjadi error pada saat proses login!",
      );

    res.cookie("refresh_token", refreshTokenStr, cookieOptions);

    if (result) return res.status(200).json({ token: result.accessToken });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    // logout accepts expired access token
    const authorization = req.headers.authorization || " ";
    // console.log(authorization);
    const authHeader = authorization.split(" ");

    if (!authHeader.includes("Bearer"))
      throw errorResponder(errors.UNAUTHORIZED);

    const refreshToken = req.cookies.refresh_token;
    const accessToken = authHeader[1] || "";

    const payload = service.decodeUserPayload(accessToken);
    // console.log('logout paylaod', payload);

    const { exp, jti, user_id } = payload;
    const userId = parseUserId(user_id);

    // uuid.token
    const refreshTokenCookie = req.cookies.refresh_token;
    if (!refreshTokenCookie)
      throw errorResponder(errors.BAD_REQUEST, "Refresh Token tidak ada!");
    const refreshTokenId = refreshTokenCookie.split(".")[0];

    // const result = await tokenService.invalidateJti(exp, jti);
    const result = await tokenService.clearOneRefreshToken(
      refreshTokenId,
      userId,
      false,
    );
    res.clearCookie("refresh_token");

    if (result) return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

async function authMe(req, res, next) {
  try {
    if (req.user) return res.status(200).json(req.user);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register,
  login,
  changeProfile,
  getProfile,
  requestUserOtp,
  verifyUserEmailByOtp,
  handleGoogleAuth,
  resetPassword,
  checkOtpMatched,
  refresh,
  logout,
  authMe,
  uploadProfileImage,
};
