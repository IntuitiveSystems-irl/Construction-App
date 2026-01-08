const express = require('express');
const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // TODO: Save to DB
  res.status(200).json({ message: 'Registered!' });
});

module.exports = router;
