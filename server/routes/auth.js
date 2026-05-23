const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');

const {
  register,
  verifyOTP,
  resendOTP,
  login,
  getMe,
  changePassword,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);

router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);

module.exports = router;