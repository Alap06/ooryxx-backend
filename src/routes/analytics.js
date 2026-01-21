const express = require('express');
const router = express.Router();

// TODO: Implémenter les routes analytics
router.get('/test', (req, res) => {
  res.json({ message: 'Analytics routes OK' });
});

module.exports = router;
