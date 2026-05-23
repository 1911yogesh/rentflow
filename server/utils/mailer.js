const nodemailer = require('nodemailer');

/**
 * Gmail SMTP Transporter
 * Requires:
 * - Gmail 2FA enabled
 * - Google App Password
 */

const transporter = nodemailer.createTransport({
  service: 'gmail',

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Verify SMTP connection
 */
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error);
  } else {
    console.log('✅ Gmail SMTP Working');
  }
});

/**
 * Send OTP Email
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
          }

          .header p {
            color: rgba(255,255,255,0.8);
            margin-top: 6px;
          }

          .body {
            padding: 36px 32px;
          }

          .body p {
            color: #374151;
            line-height: 1.6;
          }

          .otp-box {
            background: #eff6ff;
            border: 2px dashed #3b82f6;
            border-radius: 12px;
            text-align: center;
            padding: 24px;
            margin: 28px 0;
          }

          .otp-box .code {
            font-size: 42px;
            font-weight: 800;
            color: #1d4ed8;
            letter-spacing: 8px;
          }

          .footer {
            background: #f9fafb;
            border-top: 1px solid #f3f4f6;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
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
              Use the OTP below to verify your RentFlux account.
            </p>

            <div class="otp-box">
              <div class="code">${otp}</div>

              <p>
                Valid for 5 minutes
              </p>
            </div>

            <p>
              If you did not request this, please ignore this email.
            </p>

          </div>

          <div class="footer">
            © ${new Date().getFullYear()} RentFlux · All rights reserved
          </div>

        </div>
      </body>
      </html>
    `;

    const response = await transporter.sendMail({
      from: `"RentFlux" <${process.env.SMTP_USER}>`,
      to,
      subject: `${otp} — Your RentFlux Verification Code`,
      html,
    });

    console.log('✅ OTP Email Sent:', response.messageId);

    return response;

  } catch (error) {

    console.error('❌ Gmail Email Error:', error);

    throw new Error('Failed to send OTP email');
  }
};