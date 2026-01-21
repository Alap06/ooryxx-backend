const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// User routes
router.get('/my', messageController.getMyMessages);
router.get('/unread-count', messageController.getUnreadCount);
router.put('/read-all', messageController.markAllAsRead);
router.put('/:id/read', messageController.markAsRead);

// Admin only routes
router.get('/search-users', authorize('admin'), messageController.searchUsers);
router.get('/', authorize('admin'), messageController.getAllMessages);
router.post('/', authorize('admin'), messageController.sendMessage);
router.delete('/:id', authorize('admin'), messageController.deleteMessage);

module.exports = router;
