const transporter = require('../config/emailConfig');
const logger = require('../utils/logger');

/**
 * Send OTP verification email to user
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<Object>} Email send result
 * @throws {Error} If email configuration is missing or sending fails
 */
const sendOTPEmail = async (email, otp) => {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    logger.error('EMAIL_SERVICE_UNAVAILABLE', {
      reason: 'configuration_missing',
      missing: ['MAIL_USER', 'MAIL_PASS'].filter(key => !process.env[key])
    });
    throw new Error('Email configuration is missing. Please check MAIL_USER and MAIL_PASS environment variables.');
  }

  const mailOptions = {
    from: `"CargoNepal" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Your CargoNepal Email Verification Code',
    html: getOTPEmailTemplate(otp),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    logger.error('EMAIL_SEND_FAILED', {
      email,
      error: error.message,
      type: 'otp_verification'
    });
    throw error;
  }
};

/**
 * Generate HTML template for OTP email
 * @param {string} otp - OTP code to display
 * @returns {string} HTML email template
 */
const getOTPEmailTemplate = (otp) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Email Verification</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">Your OTP code is:</p>
        <div style="background-color: #fff7ed; border: 2px solid #ff6600; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #ff6600; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">This OTP is valid for 10 minutes.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
      </div>
    </div>
  `;
};

/**
 * Send password reset OTP email to user
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<Object>} Email send result
 * @throws {Error} If email configuration is missing or sending fails
 */
const sendPasswordResetEmail = async (email, otp) => {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    logger.error('EMAIL_SERVICE_UNAVAILABLE', {
      reason: 'configuration_missing',
      missing: ['MAIL_USER', 'MAIL_PASS'].filter(key => !process.env[key])
    });
    throw new Error('Email configuration is missing. Please check MAIL_USER and MAIL_PASS environment variables.');
  }

  const mailOptions = {
    from: `"CargoNepal" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'CargoNepal Password Reset Code',
    html: getPasswordResetEmailTemplate(otp),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    logger.error('EMAIL_SEND_FAILED', {
      email,
      error: error.message,
      type: 'password_reset'
    });
    throw error;
  }
};

/**
 * Generate HTML template for password reset OTP email
 * @param {string} otp - OTP code to display
 * @returns {string} HTML email template
 */
const getPasswordResetEmailTemplate = (otp) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Request</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">Your password reset code is:</p>
        <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #d97706; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">This code is valid for 10 minutes.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
      </div>
    </div>
  `;
};

/**
 * Send contact form notification to admin
 * @param {Object} contactData - Contact form data
 * @returns {Promise<Object>} Email send result
 */
const sendContactNotification = async (contactData) => {
  const timestamp = new Date().toISOString();
  
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    logger.error('EMAIL_SERVICE_UNAVAILABLE', {
      reason: 'configuration_missing',
      missing: ['MAIL_USER', 'MAIL_PASS'].filter(key => !process.env[key])
    });
    throw new Error('Email configuration is missing');
  }

  

  const mailOptions = {
    from: `"CargoNepal Contact Form" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_USER, // Send to admin email
    subject: `New Contact Form Submission: ${contactData.subject}`,
    html: getContactNotificationTemplate(contactData),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    return info;
  } catch (error) {
    logger.error('EMAIL_SEND_FAILED', {
      email,
      error: error.message,
      type: 'contact_notification'
    });
    throw error;
  }
};

/**
 * Send contact form confirmation to user
 * @param {Object} userData - User contact data
 * @returns {Promise<Object>} Email send result
 */
const sendContactConfirmation = async (userData) => {
  const timestamp = new Date().toISOString();
  
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    logger.error('EMAIL_SERVICE_UNAVAILABLE', {
      reason: 'configuration_missing',
      missing: ['MAIL_USER', 'MAIL_PASS'].filter(key => !process.env[key])
    });
    throw new Error('Email configuration is missing');
  }

  

  const mailOptions = {
    from: `"CargoNepal" <${process.env.MAIL_USER}>`,
    to: userData.email,
    subject: 'Thank you for contacting CargoNepal',
    html: getContactConfirmationTemplate(userData),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    return info;
  } catch (error) {
    logger.error('EMAIL_SEND_FAILED', {
      email,
      error: error.message,
      type: 'contact_confirmation'
    });
    throw error;
  }
};

/**
 * Send notification alert to admin
 */
const sendAdminNotificationAlert = async (adminEmail, notifications) => {
  try {
    const notificationsHtml = notifications.map(notification => `
      <div style="background: ${getPriorityColor(notification.priority)}; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid ${getPriorityBorderColor(notification.priority)};">
        <h3 style="margin: 0 0 10px 0; color: #1a202c; font-size: 16px; font-weight: 600;">
          ${notification.title}
        </h3>
        <p style="margin: 0 0 8px 0; color: #4a5568; font-size: 14px; line-height: 1.5;">
          ${notification.message}
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
          <span style="font-size: 12px; color: #718096;">
            ${new Date(notification.createdAt).toLocaleString()}
          </span>
          ${notification.actionUrl ? `
            <a href="${process.env.FRONTEND_URL}${notification.actionUrl}" 
               style="background: #3182ce; color: white; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 500;">
              View Details
            </a>
          ` : ''}
        </div>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Notification Alert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a202c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f7fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🔔 Admin Notification Alert</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">You have ${notifications.length} important notification${notifications.length > 1 ? 's' : ''}</p>
          </div>
          <div class="content">
            ${notificationsHtml}
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL}/admin/notifications" 
                 style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                View All Notifications
              </a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated notification from CargoNepal Admin System.</p>
            <p>If you didn't expect this email, please contact your system administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"CargoNepal Admin" <${process.env.EMAIL_FROM}>`,
      to: adminEmail,
      subject: `Admin Alert: ${notifications.length} Critical Notification${notifications.length > 1 ? 's' : ''}`,
      html,
      priority: 'high',
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High'
      }
    });

    const timestamp = new Date().toISOString();
    
    return info;
  } catch (error) {
    const timestamp = new Date().toISOString();
    logger.error('EMAIL_SEND_FAILED', {
      email: adminEmail,
      error: error.message,
      type: 'admin_notification'
    });
    throw error;
  }
};

/**
 * Get priority color for email styling
 */
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return '#fed7d7';
    case 'medium': return '#feebc8';
    case 'low': return '#c6f6d5';
    default: return '#e2e8f0';
  }
};

/**
 * Generate HTML template for contact notification email (to admin)
 */
const getContactNotificationTemplate = (contactData) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">New Contact Form Submission</h2>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 5px 0; color: #4b5563;"><strong>Contact ID:</strong> ${contactData.contactId}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Name:</strong> ${contactData.name}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Email:</strong> ${contactData.email}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Phone:</strong> ${contactData.phone}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Subject:</strong> ${contactData.subject}</p>
        </div>
        <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #1f2937; margin-top: 20px;">
          <h3 style="color: #1f2937; margin-top: 0;">Message:</h3>
          <p style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${contactData.message}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Please review and respond to this inquiry promptly.</p>
      </div>
    </div>
  `;
};

/**
 * Generate HTML template for contact confirmation email (to user)
 */
const getContactConfirmationTemplate = (userData) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Thank You for Contacting CargoNepal</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Dear ${userData.name},</p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">We have received your inquiry regarding:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #1f2937; font-weight: bold; margin: 0;">${userData.subject}</p>
        </div>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Our team will review your message and get back to you as soon as possible, typically within 24 hours.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Best regards,<br>The CargoNepal Team</p>
      </div>
    </div>
  `;
};

const sendBookingStatusUpdateEmail = async ({
  to,
  customerName,
  truckTitle,
  status,
  bookingId,
  pickupAddress,
  dropoffAddress,
  price,
}) => {
  const timestamp = new Date().toISOString();

  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    logger.error('EMAIL_SERVICE_UNAVAILABLE', {
      reason: 'configuration_missing',
      missing: ['MAIL_USER', 'MAIL_PASS'].filter(key => !process.env[key])
    });
    throw new Error('Email configuration is missing. Please check MAIL_USER and MAIL_PASS environment variables.');
  }

  const statusLabels = {
    accepted: 'Accepted',
    in_transit: 'In Transit',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const statusLabel = statusLabels[status] || 'Updated';
  const subject = `CargoNepal Booking ${statusLabel}`;

  

  const mailOptions = {
    from: `"CargoNepal" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html: getBookingStatusEmailTemplate({
      customerName,
      truckTitle,
      statusLabel,
      bookingId,
      pickupAddress,
      dropoffAddress,
      price,
    }),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    return info;
  } catch (error) {
    logger.error('EMAIL_SEND_FAILED', {
      email: to,
      error: error.message,
      type: 'booking_status'
    });
    throw error;
  }
};

const getBookingStatusEmailTemplate = ({
  customerName,
  truckTitle,
  statusLabel,
  bookingId,
  pickupAddress,
  dropoffAddress,
  price,
}) => {
  const bookingRef = bookingId ? bookingId.toString().slice(-8).toUpperCase() : 'N/A';
  const safeCustomerName = customerName || 'Customer';
  const safeTruckTitle = truckTitle || 'your truck';
  const safePickup = pickupAddress || 'N/A';
  const safeDropoff = dropoffAddress || 'N/A';
  const safePrice = typeof price === 'number' ? `₹${price}` : 'N/A';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 10px;">Booking ${statusLabel}</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hello ${safeCustomerName},</p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Your booking status has been updated.</p>

        <div style="background-color: #f3f4f6; padding: 18px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 6px 0; color: #374151;"><strong>Booking Ref:</strong> ${bookingRef}</p>
          <p style="margin: 6px 0; color: #374151;"><strong>Truck:</strong> ${safeTruckTitle}</p>
          <p style="margin: 6px 0; color: #374151;"><strong>Status:</strong> ${statusLabel}</p>
          <p style="margin: 6px 0; color: #374151;"><strong>Pickup:</strong> ${safePickup}</p>
          <p style="margin: 6px 0; color: #374151;"><strong>Dropoff:</strong> ${safeDropoff}</p>
          <p style="margin: 6px 0; color: #374151;"><strong>Price:</strong> ${safePrice}</p>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Thank you for choosing CargoNepal.</p>
      </div>
    </div>
  `;
};

const sendPaymentCompletedEmailToCustomer = async ({
  to,
  customerName,
  ownerName,
  truckTitle,
  bookingId,
  pickupAddress,
  dropoffAddress,
  price,
}) => {
  const timestamp = new Date().toISOString();

  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    logger.error('EMAIL_SERVICE_UNAVAILABLE', {
      reason: 'configuration_missing',
      missing: ['MAIL_USER', 'MAIL_PASS'].filter(key => !process.env[key])
    });
    throw new Error('Email configuration is missing. Please check MAIL_USER and MAIL_PASS environment variables.');
  }

  

  const mailOptions = {
    from: `"CargoNepal" <${process.env.MAIL_USER}>`,
    to,
    subject: 'CargoNepal Payment Confirmed',
    html: getPaymentCustomerEmailTemplate({
      customerName,
      ownerName,
      truckTitle,
      bookingId,
      pickupAddress,
      dropoffAddress,
      price,
    }),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    return info;
  } catch (error) {
    logger.error('EMAIL_SEND_FAILED', {
      email: to,
      error: error.message,
      type: 'payment_confirmation'
    });
    throw error;
  }
};

const sendPaymentReceivedEmailToOwner = async ({
  to,
  ownerName,
  customerName,
  truckTitle,
  bookingId,
  pickupAddress,
  dropoffAddress,
  price,
}) => {
  const timestamp = new Date().toISOString();

  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    logger.error('EMAIL_SERVICE_UNAVAILABLE', {
      reason: 'configuration_missing',
      missing: ['MAIL_USER', 'MAIL_PASS'].filter(key => !process.env[key])
    });
    throw new Error('Email configuration is missing. Please check MAIL_USER and MAIL_PASS environment variables.');
  }

  

  const mailOptions = {
    from: `"CargoNepal" <${process.env.MAIL_USER}>`,
    to,
    subject: 'CargoNepal Payment Received',
    html: getPaymentOwnerEmailTemplate({
      ownerName,
      customerName,
      truckTitle,
      bookingId,
      pickupAddress,
      dropoffAddress,
      price,
    }),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    return info;
  } catch (error) {
    logger.error('EMAIL_SEND_FAILED', {
      email: to,
      error: error.message,
      type: 'payment_received'
    });
    throw error;
  }
};

const getPaymentCustomerEmailTemplate = ({
  customerName,
  ownerName,
  truckTitle,
  bookingId,
  pickupAddress,
  dropoffAddress,
  price,
}) => {
  const bookingRef = bookingId ? bookingId.toString().slice(-8).toUpperCase() : 'N/A';
  const safeCustomerName = customerName || 'Customer';
  const safeOwnerName = ownerName || 'the owner';
  const safeTruckTitle = truckTitle || 'your truck';
  const safePickup = pickupAddress || 'N/A';
  const safeDropoff = dropoffAddress || 'N/A';
  const safePrice = typeof price === 'number' ? `₹${price}` : 'N/A';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 10px;">Payment Confirmed</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hello ${safeCustomerName},</p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Your payment has been successfully received.</p>

        <div style="background-color: #ecfdf5; border: 1px solid #10b981; padding: 18px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 6px 0; color: #065f46;"><strong>Booking Ref:</strong> ${bookingRef}</p>
          <p style="margin: 6px 0; color: #065f46;"><strong>Truck:</strong> ${safeTruckTitle}</p>
          <p style="margin: 6px 0; color: #065f46;"><strong>Service Provider:</strong> ${safeOwnerName}</p>
          <p style="margin: 6px 0; color: #065f46;"><strong>Amount Paid:</strong> ${safePrice}</p>
          <p style="margin: 6px 0; color: #065f46;"><strong>Pickup:</strong> ${safePickup}</p>
          <p style="margin: 6px 0; color: #065f46;"><strong>Dropoff:</strong> ${safeDropoff}</p>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Thank you for choosing CargoNepal.</p>
      </div>
    </div>
  `;
};

const getPaymentOwnerEmailTemplate = ({
  ownerName,
  customerName,
  truckTitle,
  bookingId,
  pickupAddress,
  dropoffAddress,
  price,
}) => {
  const bookingRef = bookingId ? bookingId.toString().slice(-8).toUpperCase() : 'N/A';
  const safeOwnerName = ownerName || 'Owner';
  const safeCustomerName = customerName || 'a customer';
  const safeTruckTitle = truckTitle || 'your truck';
  const safePickup = pickupAddress || 'N/A';
  const safeDropoff = dropoffAddress || 'N/A';
  const safePrice = typeof price === 'number' ? `₹${price}` : 'N/A';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 10px;">Payment Received</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hello ${safeOwnerName},</p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">You have received a payment for a booking.</p>

        <div style="background-color: #fff7ed; border: 1px solid #f97316; padding: 18px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 6px 0; color: #7c2d12;"><strong>Booking Ref:</strong> ${bookingRef}</p>
          <p style="margin: 6px 0; color: #7c2d12;"><strong>Customer:</strong> ${safeCustomerName}</p>
          <p style="margin: 6px 0; color: #7c2d12;"><strong>Truck:</strong> ${safeTruckTitle}</p>
          <p style="margin: 6px 0; color: #7c2d12;"><strong>Amount Received:</strong> ${safePrice}</p>
          <p style="margin: 6px 0; color: #7c2d12;"><strong>Pickup:</strong> ${safePickup}</p>
          <p style="margin: 6px 0; color: #7c2d12;"><strong>Dropoff:</strong> ${safeDropoff}</p>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Thank you for using CargoNepal.</p>
      </div>
    </div>
  `;
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail,
  sendContactNotification,
  sendContactConfirmation,
  sendBookingStatusUpdateEmail,
  sendPaymentCompletedEmailToCustomer,
  sendPaymentReceivedEmailToOwner,
  sendAdminNotificationAlert
};

