require('dotenv').config();
const nodemailer = require("nodemailer");
const logger = require('../utils/logger');

logger.info('EMAIL_CONFIG_STATUS', {
  brevoApiKey: process.env.BREVO_API_KEY ? 'SET' : 'NOT SET',
  gmailUser: process.env.MAIL_USER ? 'SET' : 'NOT SET',
  gmailPass: process.env.MAIL_PASS ? 'SET' : 'NOT SET'
});

// Use Gmail SMTP as fallback (Brevo API is used in emailService.js)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

logger.info('EMAIL_SERVICE', { service: 'Gmail SMTP (fallback)' });

module.exports = transporter;
