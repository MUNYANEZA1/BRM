const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter connection (optional but useful for debugging)
transporter.verify((error, success) => {
  if (error) {
    console.warn('⚠️  Email service configuration issue:', error.message);
    console.warn('Email notifications will be disabled until valid SMTP credentials are configured.');
    console.warn('Configure SMTP settings in .env file (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)');
  } else if (success) {
    console.log('✅ Email service ready - credentials verified');
  }
});

// Send new user credentials email
const sendNewUserCredentialsEmail = async (user, password) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@restaurant.com',
      to: user.email,
      subject: 'Welcome to Bar/Restaurant Management System - Your Login Credentials',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                padding: 0;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff;
                padding: 30px 20px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
              }
              .content {
                padding: 30px 20px;
              }
              .greeting {
                font-size: 16px;
                margin-bottom: 20px;
                color: #333;
              }
              .credentials-box {
                background-color: #f9f9f9;
                border: 2px solid #667eea;
                border-radius: 6px;
                padding: 20px;
                margin: 20px 0;
                font-family: 'Courier New', monospace;
              }
              .credentials-box .label {
                color: #666;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-weight: 600;
              }
              .credentials-box .value {
                color: #333;
                font-size: 16px;
                margin-bottom: 15px;
                word-break: break-all;
                font-weight: 500;
              }
              .important-note {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .important-note strong {
                color: #856404;
              }
              .instructions {
                margin: 20px 0;
                background-color: #e7f3ff;
                border-left: 4px solid #667eea;
                padding: 15px;
                border-radius: 4px;
              }
              .instructions ol {
                margin: 10px 0;
                padding-left: 20px;
              }
              .instructions li {
                margin: 8px 0;
                color: #333;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                margin-top: 20px;
                font-weight: 600;
              }
              .footer {
                background-color: #f9f9f9;
                border-top: 1px solid #eee;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #999;
              }
              .footer a {
                color: #667eea;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to the Team! 👋</h1>
              </div>
              <div class="content">
                <div class="greeting">
                  <p>Hi <strong>${user.firstName} ${user.lastName}</strong>,</p>
                  <p>Welcome to the Bar/Restaurant Management System! An admin has created an account for you. Below are your login credentials to get started.</p>
                </div>

                <div class="credentials-box">
                  <div class="label">Username:</div>
                  <div class="value">${user.username}</div>
                  <div class="label">Email:</div>
                  <div class="value">${user.email}</div>
                  <div class="label">Temporary Password:</div>
                  <div class="value">${password}</div>
                  <div class="label">Role:</div>
                  <div class="value">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
                </div>

                <div class="important-note">
                  <strong>⚠️ Important:</strong> Please change your password immediately after your first login for security reasons. Never share your credentials with anyone.
                </div>

                <div class="instructions">
                  <strong>How to Login:</strong>
                  <ol>
                    <li>Visit the login page at <a href="${process.env.APP_URL}/login">${process.env.APP_URL}/login</a></li>
                    <li>Enter your username and password</li>
                    <li>Click "Login"</li>
                    <li>Go to Settings → Security → Change Password to set a new password</li>
                  </ol>
                </div>

                <p>If you have any issues logging in or need assistance, please contact your administrator.</p>

                <a href="${process.env.APP_URL}/login" class="button">Go to Login Page</a>
              </div>

              <div class="footer">
                <p>This is an automated message from Bar/Restaurant Management System. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Welcome to the Bar/Restaurant Management System!

Hi ${user.firstName} ${user.lastName},

Your account has been created. Here are your login credentials:

Username: ${user.username}
Email: ${user.email}
Temporary Password: ${password}
Role: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}

IMPORTANT: Please change your password immediately after your first login for security reasons.

To Login:
1. Visit ${process.env.APP_URL}/login
2. Enter your username and password
3. Go to Settings → Security → Change Password to set a new password

If you have any issues, please contact your administrator.

Best regards,
Bar/Restaurant Management System Team
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@restaurant.com',
      to: email,
      subject: 'Reset Your Password - Bar/Restaurant Management System',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link expires in 24 hours.</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  transporter,
  sendNewUserCredentialsEmail,
  sendPasswordResetEmail,
};
