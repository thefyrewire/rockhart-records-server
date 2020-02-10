const express = require('express');
const router = express.Router();

require('dotenv').config();
const jwt = require('jsonwebtoken');

const Record = require('../../models/Record');

const postRecord = async (req, res) => {
  const { token } = req.cookies;

  try {
    jwt.verify(token, process.env.JWT_SECRET);

  } catch (error) {
    console.log(error.message);
    res.sendStatus(401);
  }

  try {
    const { name, artist, album_art, spotify_url, purchase_url } = req.body;

    const record = new Record({
      name,
      artist,
      album_art,
      spotify_url: spotify_url || null,
      purchase_url: purchase_url || null,
      created_at: Date.now(),
      updated_at: Date.now()
    });

    const recordSaved = await record.save();
    console.log(`New record added to catalog: ${name} by ${artist}`);
    console.log(recordSaved);
    res.json(recordSaved.toJSON());

  } catch (error) {
    console.log(error.message);
    res.sendStatus(400);
  }
}

// router.get('/', getRecords);
router.post('/', postRecord);

module.exports = router;