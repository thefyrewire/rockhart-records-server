const express = require('express');
const router = express.Router();

require('dotenv').config();
const jwt = require('jsonwebtoken');

// @route   GET api/users/me
// @desc    Validates JWT token in cookie, returns user
const me = (req, res) => {
  const { token } = req.cookies;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.statusCode = 200;
    res.json({ authenticated: true, user: { id: decoded.id, user_name: decoded.user_name, user_id: decoded.user_id, level: decoded.level } });

  } catch (error) {
    console.error(error.message);
    res.statusCode = 401;
    res.json({ authenticated: false, user: null });
  }
}

router.get('/me', me);

module.exports = router;