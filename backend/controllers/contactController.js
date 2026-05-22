const Contact = require('../models/ContactModel');
const emailService = require('../services/emailService');
const { createAdminNotification } = require('../services/adminNotificationService');

/**
 * Submit a contact form
 */
const submitContact = async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[CONTACT_CONTROLLER] [${timestamp}] New contact form submission received`);

    const { name, email, phone, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      console.log(`[CONTACT_CONTROLLER] [${timestamp}] Validation failed - missing required fields`);
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields (name, email, subject, message)'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log(`[CONTACT_CONTROLLER] [${timestamp}] Invalid email format: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Create contact submission
    const contact = await Contact.create({
      name,
      email,
      phone: phone || undefined,
      subject,
      message
    });

    console.log(`[CONTACT_CONTROLLER] [${timestamp}] Contact form saved with ID: ${contact._id}`);

    // Create admin notification for contact form submission
    try {
      await createAdminNotification({
        type: 'contact_form',
        userName: name,
        metadata: {
          subject,
          email,
          contactId: contact._id.toString()
        }
      });
    } catch (notificationError) {
      console.error('[CONTACT_CONTROLLER] Failed to create admin notification:', notificationError);
    }

    // Send notification email to admin
    try {
      await emailService.sendContactNotification({
        contactId: contact._id.toString(),
        name,
        email,
        phone: phone || 'Not provided',
        subject,
        message
      });
      console.log(`[CONTACT_CONTROLLER] [${timestamp}] Admin notification email sent successfully`);
    } catch (emailError) {
      console.error(`[CONTACT_CONTROLLER] [${timestamp}] Failed to send admin notification email:`, emailError.message);
      // Don't fail the request if email fails
    }

    // Send confirmation email to user
    try {
      await emailService.sendContactConfirmation({
        name,
        email,
        subject
      });
      console.log(`[CONTACT_CONTROLLER] [${timestamp}] User confirmation email sent successfully`);
    } catch (emailError) {
      console.error(`[CONTACT_CONTROLLER] [${timestamp}] Failed to send user confirmation email:`, emailError.message);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      data: {
        contactId: contact._id
      }
    });

  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[CONTACT_CONTROLLER] [${timestamp}] Error submitting contact form:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form. Please try again later.'
    });
  }
};

/**
 * Get all contact submissions (Admin only)
 */
const getAllContacts = async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[CONTACT_CONTROLLER] [${timestamp}] Fetching all contact submissions - Admin ID: ${req.user.id}`);

    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('repliedBy', 'name email')
      .exec();

    const total = await Contact.countDocuments(query);

    console.log(`[CONTACT_CONTROLLER] [${timestamp}] Retrieved ${contacts.length} contact submissions`);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[CONTACT_CONTROLLER] [${timestamp}] Error fetching contacts:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact submissions'
    });
  }
};

/**
 * Update contact status (Admin only)
 */
const updateContactStatus = async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    const { id } = req.params;
    const { status } = req.body;

    console.log(`[CONTACT_CONTROLLER] [${timestamp}] Updating contact status - Contact ID: ${id}, Status: ${status}, Admin ID: ${req.user.id}`);

    if (!['pending', 'read', 'replied', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, read, replied, resolved'
      });
    }

    const updateData = { status };
    if (status === 'replied' || status === 'resolved') {
      updateData.repliedAt = new Date();
      updateData.repliedBy = req.user.id;
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('repliedBy', 'name email');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    console.log(`[CONTACT_CONTROLLER] [${timestamp}] Contact status updated successfully`);

    res.json({
      success: true,
      message: 'Contact status updated successfully',
      data: contact
    });

  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[CONTACT_CONTROLLER] [${timestamp}] Error updating contact status:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact status'
    });
  }
};

module.exports = {
  submitContact,
  getAllContacts,
  updateContactStatus
};

