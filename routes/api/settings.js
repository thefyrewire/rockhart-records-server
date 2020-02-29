const express = require('express');
const router = express.Router();

require('dotenv').config();
const jwt = require('jsonwebtoken');

const Settings = require('../../models/Settings');

const getSettings = async (req, res) => {
  try {
    let settings = await Settings.find();
    if (settings.length === 0) {
      settings = new Settings();
      settings = settings.save().then(d => d.toJSON());
    }
    return res.json(...settings);

  } catch (error) {
    return res.sendStatus(500);
  }
}

const putSettings = async (req, res) => {
  const { token } = req.cookies;

  try {
    const { level } = jwt.verify(token, process.env.JWT_SECRET);
    if (level !== 'admin') throw new Error();

    const { setting } = req.body;
    const io = req.app.get('socketio');

    const settingsUpdated = await Settings.findOneAndUpdate({}, setting, { new: true });
    console.log(settingsUpdated);
    io.sockets.emit('update-settings', settingsUpdated.toJSON());
    
    return res.sendStatus(200);

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(401);
  }


}

router.get('/', getSettings);
router.put('/', putSettings);

module.exports = router;