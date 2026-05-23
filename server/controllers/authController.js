const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { sendOTPEmail }    = require('../utils/mailer');
const { generateOTP, hashOTP, verifyOTP } = require('../utils/otp');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const safeUser = (u) => ({
  _id: u._id, name: u.name, email: u.email, role: u.role, isVerified: u.isVerified,
});

// ── POST /api/auth/register ────────────────────────────────────────────────────
// Step 1: create unverified user and send OTP
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email });
    if (exists && exists.isVerified)
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const otp       = generateOTP();
    const otpHash   = hashOTP(otp);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    let user;
    if (exists && !exists.isVerified) {
      // Overwrite previous unverified registration
      exists.name       = name;
      exists.password   = password;
      exists.otp        = otpHash;
      exists.otpExpiry  = otpExpiry;
      exists.otpAttempts = 0;
      user = await exists.save();
    } else {
      user = await User.create({ name, email, password, otp: otpHash, otpExpiry, otpAttempts: 0 });
    }

    await sendOTPEmail({ to: email, name, otp });

    res.status(201).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      email,
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ success: false, message: 'Server error. Could not send OTP.' });
  }
};

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
// Step 2: verify OTP to activate account
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const user = await User.findOne({ email }).select('+otp +otpExpiry +otpAttempts');
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isVerified)
      return res.status(400).json({ success: false, message: 'Account already verified' });
    if (user.otpAttempts >= 5)
      return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new OTP.' });
    if (!user.otpExpiry || user.otpExpiry < new Date())
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    if (!verifyOTP(otp.trim(), user.otp))  {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Mark verified, clear OTP
    user.isVerified   = true;
    user.otp          = undefined;
    user.otpExpiry    = undefined;
    user.otpAttempts  = 0;
    await user.save();

    const token = signToken(user._id);
    res.json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    console.error('verifyOTP error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── POST /api/auth/resend-otp ─────────────────────────────────────────────────
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select('+otp +otpExpiry +otpAttempts');

    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isVerified)
      return res.status(400).json({ success: false, message: 'Account already verified' });

    const otp     = generateOTP();
    user.otp      = hashOTP(otp);
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    user.otpAttempts = 0;
    await user.save();

    await sendOTPEmail({ to: email, name: user.name, otp });

    res.json({ success: true, message: 'New OTP sent to your email' });
  } catch (err) {
    console.error('resendOTP error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (!user.isVerified)
      return res.status(403).json({
        success: false,
        message: 'Email not verified. Please check your inbox.',
        requiresVerification: true,
        email,
      });

    const token = signToken(user._id);
    res.json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// ── PUT /api/auth/password ─────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword)))
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
