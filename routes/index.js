const express = require('express');
const router = express.Router();

const auth = require('./auth');
const users = require('./api/users');
const records = require('./api/records');
const requests = require('./api/requests');
const settings = require('./api/settings');
const upload = require('./api/upload');

router.use('/auth', auth);
router.use('/api/users', users);
router.use('/api/records', records);
router.use('/api/requests', requests);
router.use('/api/settings', settings);
router.use('/api/upload', upload);

module.exports = router;