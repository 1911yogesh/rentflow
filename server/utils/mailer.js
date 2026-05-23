const nodemailer = require('nodemailer');

/**
 * Gmail SMTP Transporter
 * Production-ready configuration for Render / Vercel / Railway / VPS
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 100000,
  greetingTimeout:   100000,
  socketTimeout:     100000,
});

/** Verify SMTP connection on startup */
transporter.verify((error) => {
  if (error) console.error('❌ SMTP Connection Error:', error);
  else        console.log('✅ Gmail SMTP Working');
});

// ── OTP Email ─────────────────────────────────────────────────────────────────
// OTP functionality temporarily disabled for future release
// Kept for re-activation when OTP registration is re-enabled
exports.sendOTPEmail = async ({ to, name, otp }) => {
  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      body { margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif; }
      .wrapper { max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08); }
      .header  { background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);padding:32px;text-align:center; }
      .header h1 { color:#fff;margin:0;font-size:26px;font-weight:700; }
      .header p  { color:rgba(255,255,255,0.8);margin-top:6px; }
      .body  { padding:36px 32px; }
      .body p { color:#374151;line-height:1.6; }
      .otp-box { background:#eff6ff;border:2px dashed #3b82f6;border-radius:12px;text-align:center;padding:24px;margin:28px 0; }
      .otp-box .code { font-size:42px;font-weight:800;color:#1d4ed8;letter-spacing:8px; }
      .footer { background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px;text-align:center;font-size:12px;color:#9ca3af; }
    </style></head>
    <body><div class="wrapper">
      <div class="header"><h1>🏠 RentFlux</h1><p>Rent Management System</p></div>
      <div class="body">
        <p>Hello <strong>${name}</strong>,</p>
        <p>Use the OTP below to verify your RentFlux account.</p>
        <div class="otp-box"><div class="code">${otp}</div><p>Valid for 5 minutes</p></div>
        <p>If you did not request this, please ignore this email.</p>
      </div>
      <div class="footer">© ${new Date().getFullYear()} RentFlux · All rights reserved</div>
    </div></body></html>
  `;

  const response = await transporter.sendMail({
    from: `"RentFlux" <${process.env.SMTP_USER}>`,
    to, subject: `${otp} — Your RentFlux Verification Code`, html,
  });
  console.log('✅ OTP Email Sent:', response.messageId);
  return response;
};

// ── Reset Password Email ──────────────────────────────────────────────────────
/**
 * Sends a professional password reset email with a secure link
 * @param {object} params - { to, name, resetUrl, expiry }
 */
exports.sendResetPasswordEmail = async ({ to, name, resetUrl, expiry }) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body { margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif; }
          .wrapper { max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08); }
          .header { background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);padding:32px;text-align:center; }
          .header h1 { color:#fff;margin:0;font-size:26px;font-weight:700; }
          .header p { color:rgba(255,255,255,0.8);margin-top:6px; }
          .body { padding:36px 32px; }
          .body p { color:#374151;line-height:1.7;margin:0 0 16px; }
          .btn-wrap { text-align:center;margin:28px 0; }
          .btn {
            display:inline-block;padding:14px 36px;
            background:linear-gradient(135deg,#2563eb,#1d4ed8);
            color:#fff;text-decoration:none;border-radius:12px;
            font-size:16px;font-weight:700;letter-spacing:0.3px;
          }
          .notice { background:#fefce8;border:1px solid #fde047;border-radius:10px;padding:14px 18px;margin:24px 0; }
          .notice p { color:#713f12;font-size:13px;margin:0; }
          .fallback { font-size:12px;color:#9ca3af;word-break:break-all;margin-top:8px; }
          .footer { background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px;text-align:center;font-size:12px;color:#9ca3af; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>🏠 RentFlux</h1>
            <p>Rent Management System</p>
          </div>
          <div class="body">
            <p>Hello <strong>${name}</strong>,</p>
            <p>
              We received a request to reset the password for your RentFlux account.
              Click the button below to set a new password.
            </p>
            <div class="btn-wrap">
              <a href="${resetUrl}" class="btn">Reset Password →</a>
            </div>
            <div class="notice">
              <p>⏰ This link expires in <strong>${expiry}</strong>. After that you'll need to request a new one.</p>
            </div>
            <p>If you didn't request a password reset, you can safely ignore this email — your account remains secure.</p>
            <p>If the button above doesn't work, copy and paste this link into your browser:</p>
            <p class="fallback">${resetUrl}</p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} RentFlux · All rights reserved
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await transporter.sendMail({
      from:    `"RentFlux" <${process.env.SMTP_USER}>`,
      to,
      subject: `Reset Your RentFlux Password`,
      html,
    });

    console.log('✅ Password Reset Email Sent:', response.messageId);
    return response;
  } catch (error) {
    console.error('❌ Reset Email Error:', error);
    throw new Error('Failed to send reset password email');
  }
};
