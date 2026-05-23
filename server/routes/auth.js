const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/auth');

const {
  register,
  verifyOTP,   // OTP functionality temporarily disabled for future release
  resendOTP,   // OTP functionality temporarily disabled for future release
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

router.post('/register',       register);
router.post('/verify-otp',     verifyOTP);   // OTP functionality temporarily disabled for future release
router.post('/resend-otp',     resendOTP);   // OTP functionality temporarily disabled for future release
router.post('/login',          login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

router.get('/me',       protect, getMe);
router.put('/password', protect, changePassword);

module.exports = router;
