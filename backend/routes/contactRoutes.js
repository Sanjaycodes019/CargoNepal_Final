const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authMiddleware');
const {
  submitContact,
  getAllContacts,
  updateContactStatus
} = require('../controllers/contactController');

// Public route - anyone can submit contact form
router.post('/submit', submitContact);

// Admin routes - require authentication and admin role
router.use(authMiddleware);
router.use(authorize('admin'));

router.get('/all', getAllContacts);
router.patch('/:id/status', updateContactStatus);

module.exports = router;

