const crypto = require('crypto');

/**
 * Generate a 6-digit numeric OTP.
 */
exports.generateOTP = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

/**
 * Hash OTP before storing in DB (bcrypt-like but faster for short codes).
 * We store a SHA-256 hash so plain OTPs are not in the DB.
 */
exports.hashOTP = (otp) =>
  crypto.createHash('sha256').update(otp).digest('hex');

/**
 * Compare plain OTP against stored hash.
 */
exports.verifyOTP = (plain, hash) =>
  crypto.createHash('sha256').update(plain).digest('hex') === hash;
