const nodemailer = require('nodemailer');

const hasRealSmtpConfig = () => {
  return !!(
    (process.env.GMAIL_USER && (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS)) ||
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  );
};

// Initialize mail transporter with environmental flexibility
let cachedTransporter = null;
let cachedType = null;

const createTransporter = async () => {
  // 1. Direct Gmail Service
  if (process.env.GMAIL_USER && (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS)) {
    const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '';
    const pass = rawPass.replace(/\s+/g, ''); // Strip spaces from Google App Password
    const user = process.env.GMAIL_USER.trim();
    const typeKey = `gmail_${user}`;

    if (!cachedTransporter || cachedType !== typeKey) {
      cachedTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });
      cachedType = typeKey;
    }
    return { transporter: cachedTransporter, isReal: true };
  }

  // 2. Custom SMTP Server (SendGrid, Mailgun, Brevo, AWS SES, Resend, etc.)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const host = process.env.SMTP_HOST.trim();
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER.trim();
    const pass = process.env.SMTP_PASS.trim();
    const typeKey = `smtp_${host}_${user}`;

    if (!cachedTransporter || cachedType !== typeKey) {
      cachedTransporter = nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === 'true' || port === 465,
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });
      cachedType = typeKey;
    }
    return { transporter: cachedTransporter, isReal: true };
  }

  // 3. Fallback Test Account (Ethereal Mail for automated testing / dev sandbox)
  try {
    const testAccount = await nodemailer.createTestAccount();
    const ethTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000
    });
    console.log('[Mailer] Using Ethereal Mail sandbox for testing.');
    return { transporter: ethTransporter, isReal: false };
  } catch (err) {
    console.warn('[Mailer] Could not create Ethereal test account:', err.message);
    return { transporter: null, isReal: false };
  }
};

/**
 * Sends a 6-digit password reset verification code to the recipient's email.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} code - 6-digit verification code
 * @param {string} userName - Name of the user (optional)
 * @returns {Promise<{success: boolean, previewUrl?: string}>}
 */
const sendPasswordResetCode = async (toEmail, code, userName = 'User') => {
  console.log(`\n======================================================`);
  console.log(`[QChat Security] Password Reset Verification Code for ${toEmail}: [ ${code} ]`);
  console.log(`Expires in: 15 minutes`);
  console.log(`======================================================\n`);

  const fromSender = process.env.EMAIL_FROM ||
    (process.env.GMAIL_USER ? `"QChat Security" <${process.env.GMAIL_USER}>` :
    (process.env.SMTP_USER ? `"QChat Security" <${process.env.SMTP_USER}>` : '"QChat Quantum Security" <security@qchat.quantum>'));

  const mailOptions = {
    from: fromSender,
    to: toEmail,
    subject: `🔐 QChat Verification Code: ${code}`,
    text: `Hello ${userName},\n\nYour 6-digit password reset verification code for QChat is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you did not request a password reset, please ignore this email or check your account security.\n\n— QChat Quantum Security Team`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QChat Password Reset</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b141a; color: #e9edef; margin: 0; padding: 20px; }
          .container { max-width: 520px; margin: 0 auto; background-color: #111b21; border-radius: 12px; border: 1px solid #222e35; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #00a884 0%, #005c4b 100%); padding: 28px 24px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px; }
          .content { padding: 32px 28px; }
          .greeting { font-size: 15px; font-weight: 600; color: #ffffff; margin-bottom: 12px; }
          .message { font-size: 14px; line-height: 1.6; color: #8696a0; margin-bottom: 24px; }
          .code-card { background-color: #202c33; border: 2px dashed #00a884; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
          .code-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #00a884; letter-spacing: 1.5px; margin-bottom: 8px; }
          .code-digits { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 34px; font-weight: 800; color: #00e5b8; letter-spacing: 8px; margin: 0; }
          .expiry-note { font-size: 12px; color: #8696a0; margin-top: 10px; }
          .warning { background-color: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 12px 14px; border-radius: 4px; font-size: 12px; color: #fca5a5; line-height: 1.5; margin: 24px 0; }
          .footer { padding: 20px 28px; background-color: #0c1317; border-top: 1px solid #222e35; text-align: center; font-size: 12px; color: #667781; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ QChat Security</h1>
            <p>Quantum Digital Signature Messenger</p>
          </div>
          <div class="content">
            <div class="greeting">Hello ${userName},</div>
            <p class="message">
              We received a request to reset your password for your QChat account. Enter the 6-digit verification code below to authorize your password update:
            </p>
            <div class="code-card">
              <div class="code-label">Verification Code</div>
              <div class="code-digits">${code}</div>
              <div class="expiry-note">⏱️ Valid for 15 minutes</div>
            </div>
            <div class="warning">
              <strong>Security Alert:</strong> If you did not initiate this request, your password will remain unchanged. Please ensure your email account is secure and never share this code with anyone.
            </div>
          </div>
          <div class="footer">
            Protected by QChat Quantum Security & Ekert91 (E91) Channel Monitoring.<br>&copy; 2026 QChat Messenger.
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const { transporter, isReal } = await createTransporter();
    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[Mailer] Test Email Preview URL: ${previewUrl}`);
      }
      return {
        success: true,
        isRealEmail: isReal,
        messageId: info.messageId,
        previewUrl: previewUrl || null
      };
    }
    return {
      success: true,
      isRealEmail: false,
      messageId: 'console-log-fallback',
      previewUrl: null
    };
  } catch (err) {
    console.warn('[Mailer] Error sending email via transporter:', err.message);
    // Don't throw, return structured failure with error details
    return {
      success: false,
      isRealEmail: false,
      error: err.message
    };
  }
};

module.exports = {
  sendPasswordResetCode,
  hasRealSmtpConfig
};

