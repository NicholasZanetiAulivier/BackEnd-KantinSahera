const bcrypt = require('bcrypt');

async function hashPassword(plaintextPassword) {
  const saltRounds = 8;

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
};