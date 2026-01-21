const express = require('express');
const router = express.Router();

// TODO: Implémenter les routes paiements
router.get('/test', (req, res) => {
  res.json({ message: 'Payment routes OK' });
});

module.exports = router;
