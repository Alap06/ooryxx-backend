const express = require('express');
const router = express.Router();
const {
  getActiveAnnouncements,
  getAllAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncement
} = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/auth');

// Public route - Get active announcements
router.get('/active', getActiveAnnouncements);

// Admin routes
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getAllAnnouncements)
  .post(createAnnouncement);

router.route('/:id')
  .get(getAnnouncement)
  .put(updateAnnouncement)
  .delete(deleteAnnouncement);

router.patch('/:id/toggle', toggleAnnouncement);

module.exports = router;
