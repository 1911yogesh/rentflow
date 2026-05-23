const nodemailer = require('nodemailer');

/**
 * Production-ready SMTP transporter
 * Compatible with:
 * - Brevo
 * - Gmail
 * - Render deployment
 */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,

  port: Number(process.env.SMTP_PORT || 587),

  secure: process.env.SMTP_SECURE === 'true',

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  // Prevent Render timeout issues
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,

  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Verify SMTP connection on server start
 */
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error);
  } else {
    console.log('✅ SMTP Server Ready');
  }
});

/**
 * Send OTP verification email
 */
exports.sendOTPEmail = async ({ to, name, otp }) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body {
            margin: 0;
            padding: 0;
            background: #f4f6fb;
            font-family: 'Segoe UI', Arial, sans-serif;
          }

          .wrapper {
            max-width: 520px;
            margin: 40px auto;
            background: #fff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          }

          .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            padding: 32px;
            text-align: center;
          }

          .header h1 {
            color: #fff;
            margin: 0;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }

          .header p {
            color: rgba(255,255,255,0.8);
            margin: 6px 0 0;
            font-size: 14px;
          }

          .body {
            padding: 36px 32px;
          }

          .body p {
            color: #374151;
            font-size: 15px;
            line-height: 1.6;
            margin: 0 0 16px;
          }

          .otp-box {
            background: #eff6ff;
            border: 2px dashed #3b82f6;
            border-radius: 12px;
            text-align: center;
            padding: 24px;
            margin: 28px 0;
          }

          .otp-box .label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 8px;
          }

          .otp-box .code {
            font-size: 42px;
            font-weight: 800;
            color: #1d4ed8;
            letter-spacing: 8px;
          }

          .otp-box .timer {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 8px;
          }

          .footer {
            background: #f9fafb;
            border-top: 1px solid #f3f4f6;
            padding: 20px 32px;
            text-align: center;
          }

          .footer p {
            color: #9ca3af;
            font-size: 12px;
            margin: 0;
          }
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
              You're almost there! Use the verification code below
              to complete your RentFlux account setup.
            </p>

            <div class="otp-box">
              <div class="label">
                Your One-Time Password
              </div>

              <div class="code">
                ${otp}
              </div>

              <div class="timer">
                ⏱ Valid for 5 minutes only
              </div>
            </div>

            <p>
              If you didn't request this, you can safely ignore this email.
              Someone may have typed your address by mistake.
            </p>

            <p style="color:#9ca3af; font-size:13px;">
              Do not share this OTP with anyone.
            </p>
          </div>

          <div class="footer">
            <p>
              © ${new Date().getFullYear()} RentFlux · All rights reserved
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"RentFlux" <${process.env.SMTP_USER}>`,
      to,
      subject: `${otp} — Your RentFlux Verification Code`,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ OTP Email Sent:', info.messageId);

    return info;

  } catch (error) {
    console.error('❌ OTP Email Send Error:', error);

    throw new Error('Failed to send OTP email');
  }
};