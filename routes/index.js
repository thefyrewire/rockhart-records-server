const express = require('express');
const router = express.Router();

const auth = require('./auth');
const users = require('./api/users');
const records = require('./api/records');

router.use('/auth', auth);
router.use('/api/users', users);
router.use('/api/records', records);

module.exports = router;