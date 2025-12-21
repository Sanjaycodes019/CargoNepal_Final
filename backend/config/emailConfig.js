require('dotenv').config();
const nodemailer = require("nodemailer");
const logger = require('../utils/logger');

logger.info('EMAIL_CONFIG_STATUS', {
  mailUser: process.env.MAIL_USER ? 'SET' : 'NOT SET',
  mailPass: process.env.MAIL_PASS ? 'SET' : 'NOT SET'
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

module.exports = transporter;
