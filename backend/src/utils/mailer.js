const nodemailer = require('nodemailer');
const axios = require('axios');

/**
 * Detects active email delivery provider and returns status metadata.
 */
const getEmailProviderStatus = () => {
  if (process.env.RESEND_API_KEY) {
    return {
      provider: 'resend',
      protocol: 'https',
      port: 443,
      name: 'Resend REST API',
      description: 'Cloud Firewall Proof (HTTPS Port 443)'
    };
  }
  if (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY) {
    return {
      provider: 'brevo',
      protocol: 'https',
      port: 443,
      name: 'Brevo / Sendinblue REST API',
      description: 'Cloud Firewall Proof (HTTPS Port 443)'
    };
  }
  if (process.env.SENDGRID_API_KEY) {
    return {
      provider: 'sendgrid',
      protocol: 'https',
      port: 443,
      name: 'SendGrid REST API',
      description: 'Cloud Firewall Proof (HTTPS Port 443)'
    };
  }
  if (process.env.EMAIL_WEBHOOK_URL || process.env.GMAIL_WEBHOOK_URL) {
    return {
      provider: 'webhook',
      protocol: 'https',
      port: 443,
      name: 'HTTPS Email Webhook Relay (Google Apps Script / Cloudflare)',
      description: 'Dispatches real emails via HTTPS webhook relay'
    };
  }
  if (process.env.GMAIL_USER && (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS)) {
    return {
      provider: 'gmail_smtp',
      protocol: 'smtp',
      port: 587,
      name: 'Direct Gmail SMTP',
      description: 'Raw SMTP (Note: Ports 25/465/587 may be blocked on Render free tier)'
    };
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      provider: 'custom_smtp',
      protocol: 'smtp',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      name: 'Custom SMTP Server',
      description: 'Raw SMTP connection'
    };
  }
  return {
    provider: 'sandbox',
    protocol: 'in-memory',
    port: null,
    name: 'Demonstration / Sandbox Mode',
    description: 'Instant verification code auto-fill in UI (no external keys configured)'
  };
};

const hasRealEmailConfig = () => {
  const info = getEmailProviderStatus();
  return info.provider !== 'sandbox';
};

/**
 * 1. Resend REST API (HTTPS Port 443)
 */
const sendViaResend = async (toEmail, subject, html, text) => {
  const apiKey = process.env.RESEND_API_KEY.trim();
  const from = process.env.RESEND_FROM || process.env.EMAIL_FROM || 'QChat Security <onboarding@resend.dev>';

  const res = await axios.post(
    'https://api.resend.com/emails',
    {
      from,
      to: [toEmail],
      subject,
      html,
      text
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 8000
    }
  );

  return {
    success: true,
    isRealEmail: true,
    provider: 'resend',
    messageId: res.data?.id
  };
};

/**
 * 2. Brevo / Sendinblue REST API (HTTPS Port 443)
 */
const sendViaBrevo = async (toEmail, userName, subject, html, text) => {
  const apiKey = (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY).trim();
  const senderEmail = process.env.BREVO_SENDER || process.env.EMAIL_FROM || 'security@qchat.quantum';
  const senderName = process.env.BREVO_NAME || 'QChat Security';

  const res = await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: toEmail, name: userName || 'User' }],
      subject,
      htmlContent: html,
      textContent: text
    },
    {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      timeout: 8000
    }
  );

  return {
    success: true,
    isRealEmail: true,
    provider: 'brevo',
    messageId: res.data?.messageId
  };
};

/**
 * 3. SendGrid REST API (HTTPS Port 443)
 */
const sendViaSendGrid = async (toEmail, subject, html, text) => {
  const apiKey = process.env.SENDGRID_API_KEY.trim();
  const fromEmail = process.env.SENDGRID_FROM || process.env.EMAIL_FROM || 'security@qchat.quantum';

  const res = await axios.post(
    'https://api.sendgrid.com/v3/mail/send',
    {
      personalizations: [{ to: [{ email: toEmail }] }],
      from: { email: fromEmail, name: 'QChat Security' },
      subject,
      content: [
        { type: 'text/html', value: html },
        { type: 'text/plain', value: text }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 8000
    }
  );

  return {
    success: true,
    isRealEmail: true,
    provider: 'sendgrid',
    messageId: res.headers?.['x-message-id'] || 'sendgrid-dispatched'
  };
};

/**
 * 4. HTTPS Webhook Relay (Google Apps Script / Cloudflare Workers / Zapier)
 */
const sendViaWebhook = async (toEmail, code, userName, subject, html, text) => {
  const url = (process.env.EMAIL_WEBHOOK_URL || process.env.GMAIL_WEBHOOK_URL).trim();

  const res = await axios.post(
    url,
    {
      toEmail,
      code,
      userName,
      subject,
      html,
      text
    },
    {
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.EMAIL_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.EMAIL_WEBHOOK_SECRET}` } : {})
      },
      timeout: 8000
    }
  );

  return {
    success: true,
    isRealEmail: true,
    provider: 'webhook',
    messageId: res.data?.messageId || 'webhook-delivered'
  };
};

/**
 * 5. SMTP Fallback (Nodemailer)
 */
let cachedTransporter = null;
let cachedType = null;

const createSmtpTransporter = () => {
  if (process.env.GMAIL_USER && (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS)) {
    const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '';
    const pass = rawPass.replace(/\s+/g, '');
    const user = process.env.GMAIL_USER.trim();
    const typeKey = `gmail_${user}`;

    if (!cachedTransporter || cachedType !== typeKey) {
      cachedTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 5000
      });
      cachedType = typeKey;
    }
    return cachedTransporter;
  }

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
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 5000
      });
      cachedType = typeKey;
    }
    return cachedTransporter;
  }

  return null;
};

/**
 * Sends a 6-digit password reset verification code to the recipient's email.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} code - 6-digit verification code
 * @param {string} userName - Name of the user (optional)
 * @returns {Promise<{success: boolean, isRealEmail: boolean, provider: string, messageId?: string, error?: string}>}
 */
const sendPasswordResetCode = async (toEmail, code, userName = 'User') => {
  console.log(`\n======================================================`);
  console.log(`[QChat Security] Verification Code for ${toEmail}: [ ${code} ]`);
  console.log(`Active Provider: ${getEmailProviderStatus().name}`);
  console.log(`Expires in: 15 minutes`);
  console.log(`======================================================\n`);

  const subject = `🔐 QChat Verification Code: ${code}`;
  const text = `Hello ${userName},\n\nYour 6-digit password reset verification code for QChat is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you did not request a password reset, please ignore this email.\n\n— QChat Quantum Security Team`;
  const html = `
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
  `;

  // 1. Try Resend REST API (HTTPS port 443)
  if (process.env.RESEND_API_KEY) {
    try {
      console.log('[Mailer] Dispatching via Resend API (HTTPS Port 443)...');
      return await sendViaResend(toEmail, subject, html, text);
    } catch (err) {
      console.error('[Mailer] Resend API error:', err.response?.data || err.message);
      return { success: false, isRealEmail: false, error: `Resend: ${err.message}` };
    }
  }

  // 2. Try Brevo REST API (HTTPS port 443)
  if (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY) {
    try {
      console.log('[Mailer] Dispatching via Brevo API (HTTPS Port 443)...');
      return await sendViaBrevo(toEmail, userName, subject, html, text);
    } catch (err) {
      console.error('[Mailer] Brevo API error:', err.response?.data || err.message);
      return { success: false, isRealEmail: false, error: `Brevo: ${err.message}` };
    }
  }

  // 3. Try SendGrid REST API (HTTPS port 443)
  if (process.env.SENDGRID_API_KEY) {
    try {
      console.log('[Mailer] Dispatching via SendGrid API (HTTPS Port 443)...');
      return await sendViaSendGrid(toEmail, subject, html, text);
    } catch (err) {
      console.error('[Mailer] SendGrid API error:', err.response?.data || err.message);
      return { success: false, isRealEmail: false, error: `SendGrid: ${err.message}` };
    }
  }

  // 4. Try HTTPS Webhook / Google Apps Script Relay (HTTPS port 443)
  if (process.env.EMAIL_WEBHOOK_URL || process.env.GMAIL_WEBHOOK_URL) {
    try {
      console.log('[Mailer] Dispatching via HTTPS Webhook Relay...');
      return await sendViaWebhook(toEmail, code, userName, subject, html, text);
    } catch (err) {
      console.error('[Mailer] Webhook relay error:', err.response?.data || err.message);
      return { success: false, isRealEmail: false, error: `Webhook: ${err.message}` };
    }
  }

  // 5. Try SMTP (Nodemailer) if configured
  const smtpTransporter = createSmtpTransporter();
  if (smtpTransporter) {
    try {
      console.log('[Mailer] Attempting SMTP dispatch...');
      const fromSender = process.env.EMAIL_FROM ||
        (process.env.GMAIL_USER ? `"QChat Security" <${process.env.GMAIL_USER}>` : '"QChat Security" <security@qchat.quantum>');

      const info = await smtpTransporter.sendMail({
        from: fromSender,
        to: toEmail,
        subject,
        text,
        html
      });
      console.log('[Mailer] SMTP dispatch successful:', info.messageId);
      return {
        success: true,
        isRealEmail: true,
        provider: 'smtp',
        messageId: info.messageId
      };
    } catch (err) {
      console.warn('[Mailer] SMTP connection failed:', err.message);
      const isRender = process.env.RENDER === 'true' || !!process.env.RENDER_SERVICE_ID;
      const portNote = isRender
        ? ' (Render free tier blocks raw SMTP ports 25/465/587. Use RESEND_API_KEY or BREVO_API_KEY over HTTPS port 443).'
        : '';
      return {
        success: false,
        isRealEmail: false,
        error: `SMTP: ${err.message}${portNote}`
      };
    }
  }

  // 6. Default Sandbox Fallback (Instant, Zero Delay, No TCP Timeout)
  console.log('[Mailer] Demonstration mode active. Code logged to console.');
  return {
    success: true,
    isRealEmail: false,
    provider: 'sandbox',
    messageId: 'demo-sandbox-generated'
  };
};

module.exports = {
  sendPasswordResetCode,
  getEmailProviderStatus,
  hasRealEmailConfig
};

