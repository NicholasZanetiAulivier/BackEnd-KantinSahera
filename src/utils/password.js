const bcrypt = require('bcrypt');
const config = require('../core/config');

async function hashOtp(plaintextOtp) {
  const saltRounds = 10; // biar server gk meledak

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
  hashOtp,
};