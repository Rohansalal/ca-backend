const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter
const createTransporter = () => {
  // For development, use ethereal email (fake SMTP)
  // For production, use real SMTP service (Gmail, SendGrid, AWS SES, etc.)

  if (process.env.NODE_ENV === 'production' && process.env.EMAIL_USER) {
    return nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Development: Log emails to console instead of sending
  return {
    sendMail: async (mailOptions) => {
      logger.info('📧 Email (Development Mode)', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        text: mailOptions.text,
      });
      console.log('\n📧 ===== EMAIL SENT (DEV MODE) =====');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('=====================================');
      // Extract OTP if present in text/html for easier visibility
      const otpMatch = mailOptions.text.match(/code is: (\d{6})/);
      if (otpMatch) {
        console.log('🔑 OTP:', otpMatch[1]);
      }
      console.log('=====================================\n');
      logger.info('📧 Email (Development Mode)', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        otp: otpMatch ? otpMatch[1] : 'Not found in text'
      });
      return { messageId: 'dev-' + Date.now() };
    },
  };
};

const transporter = createTransporter();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Email templates
const getEmailTemplate = (type, data) => {
  const templates = {
    EMAIL_VERIFICATION: {
      subject: '🔐 Verify Your Email - Precision Associates',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #136da1 0%, #0d4d73 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #136da1; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #136da1; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .button { background: #136da1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Precision Associates!</h1>
              <p>Professional CA Services Platform</p>
            </div>
            <div class="content">
              <h2>Hello ${data.name}!</h2>
              <p>Thank you for registering with Precision Associates. To complete your registration, please verify your email address.</p>
              
              <div class="otp-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Your Verification Code</p>
                <div class="otp-code">${data.otp}</div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Valid for 10 minutes</p>
              </div>
              
              <p><strong>Important:</strong></p>
              <ul>
                <li>This OTP is valid for 10 minutes only</li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
              
              <p>Best regards,<br><strong>Precision Associates Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Precision Associates. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to Precision Associates!

Hello ${data.name},

Your email verification code is: ${data.otp}

This code is valid for 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
Precision Associates Team
      `,
    },
    PASSWORD_RESET: {
      subject: '🔑 Reset Your Password - Precision Associates',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #136da1 0%, #0d4d73 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #e74c3c; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #e74c3c; letter-spacing: 8px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 Password Reset Request</h1>
              <p>Precision Associates</p>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>We received a request to reset your password. Use the code below to proceed:</p>
              
              <div class="otp-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Your Reset Code</p>
                <div class="otp-code">${data.otp}</div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Valid for 10 minutes</p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Alert:</strong>
                <p style="margin: 5px 0 0 0;">If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
              </div>
              
              <p><strong>Important:</strong></p>
              <ul>
                <li>This code expires in 10 minutes</li>
                <li>Never share this code with anyone</li>
                <li>Our team will never ask for this code</li>
              </ul>
              
              <p>Best regards,<br><strong>Precision Associates Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Precision Associates. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Password Reset Request - Precision Associates

Hello,

Your password reset code is: ${data.otp}

This code is valid for 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
Precision Associates Team
      `,
    },
  };

  return templates[type] || templates.EMAIL_VERIFICATION;
};

// Send OTP email
const sendOTPEmail = async (email, otp, type, additionalData = {}) => {
  try {
    const template = getEmailTemplate(type, { ...additionalData, otp });

    const mailOptions = {
      from: `"Precision Associates" <${process.env.EMAIL_USER || 'noreply@precisionassociates.com'}>`,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to: email,
      type,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email sending failed', error, { email, type });
    throw new Error('Failed to send email');
  }
};

// Send welcome email (after verification)
const sendWelcomeEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: `"Precision Associates" <${process.env.EMAIL_USER || 'noreply@precisionassociates.com'}>`,
      to: email,
      subject: '🎉 Welcome to Precision Associates!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #136da1 0%, #0d4d73 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #136da1; }
            .button { background: #136da1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome Aboard!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Your email has been verified successfully. Welcome to Precision Associates!</p>
              
              <h3>What's Next?</h3>
              <div class="feature">
                <strong>📋 Browse Services</strong>
                <p>Explore our comprehensive CA services</p>
              </div>
              <div class="feature">
                <strong>💼 Complete Your Profile</strong>
                <p>Add more details to get personalized service</p>
              </div>
              <div class="feature">
                <strong>📄 Upload Documents</strong>
                <p>Securely store your important documents</p>
              </div>
              
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">Go to Dashboard</a>
              </p>
              
              <p>If you have any questions, feel free to reach out to our support team.</p>
              
              <p>Best regards,<br><strong>Precision Associates Team</strong></p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info('Welcome email sent', { email });
  } catch (error) {
    logger.error('Welcome email failed', error, { email });
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
};
