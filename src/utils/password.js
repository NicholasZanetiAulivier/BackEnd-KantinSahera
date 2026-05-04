const bcrypt = require('bcrypt');
const config = require('../core/config');

async function hashOtpUser(plaintextOtp) {
  const saltRounds = 9; // biar server gk meledak

  const hashedOtp = await new Promise((resolve, reject) => {
    bcrypt.hash(plaintextOtp, saltRounds, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });

  return hashedOtp;
}

async function hashOtpAdmin(plaintextOtp) {
  const salt = config.secret.admin; // Switch to salt string

  const hashedOtp = await new Promise((resolve, reject) => {
    bcrypt.hash(plaintextOtp, salt, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });

  return hashedOtp;
}

async function hashPassword(plaintextPassword) {
  const saltRounds = 12;

  const hashedPassword = await new Promise((resolve, reject) => {
    bcrypt.hash(plaintextPassword, saltRounds, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });

  return hashedPassword;
}

async function passwordMatched(plaintextPassword, hashedPassword) {
  return await bcrypt.compare(plaintextPassword, hashedPassword);
}

module.exports = {
  hashPassword,
  passwordMatched,
  hashOtpUser,
  hashOtpAdmin
};