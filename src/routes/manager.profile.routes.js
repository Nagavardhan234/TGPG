const express = require('express');
const router = express.Router();
const managerProfileController = require('../controllers/manager.profile.controller');
const { authenticateManager } = require('../middleware/auth');

// All routes require manager authentication
router.use(authenticateManager);

// Get manager profile
router.get('/profile', managerProfileController.getProfile);

// Update manager profile
router.put('/profile', managerProfileController.updateProfile);

// Update PG details
router.put('/pg-details', managerProfileController.updatePGDetails);

// Update profile image
router.put('/profile-image', managerProfileController.updateProfileImage);

module.exports = router; 