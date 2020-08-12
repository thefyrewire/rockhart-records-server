const express = require('express');
const router = express.Router();

require('dotenv').config();
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');

const Record = require('../../models/Record');

const getRecords = async (req, res) => {
  try {
    const records = await Record.find();
    return res.json({ records });

  } catch (error) {
    return res.sendStatus(500);
  }
}

const postRecord = async (req, res) => {
  const { token } = req.cookies;

  try {
    const { level } = jwt.verify(token, process.env.JWT_SECRET);
    if (level !== 'admin') throw new Error();

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(401);
  }

  try {
    const { name, artist, album_art, spotify_url, purchase_url, stream_safe } = req.body;

    const record = new Record({
      name,
      artist,
      album_art,
      spotify_url: spotify_url || null,
      purchase_url: purchase_url || null,
      stream_safe,
      created_at: Date.now(),
      updated_at: Date.now()
    });

    const recordSaved = await record.save();
    console.log(`New record added to catalog: ${name} by ${artist}`);
    console.log(recordSaved);
    return res.json({ record: recordSaved.toJSON() });

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(400);
  }
}

const putRecord = async (req, res) => {
  const { token } = req.cookies;

  try {
    const { level } = jwt.verify(token, process.env.JWT_SECRET);
    if (level !== 'admin') throw new Error();

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(401);
  }

  try {
    const { id } = req.params;
    const { name, artist, album_art, spotify_url, purchase_url, stream_safe } = req.body;

    const recordUpdated = await Record.findByIdAndUpdate(id , {
      name,
      artist,
      album_art,
      spotify_url: spotify_url || null,
      purchase_url: purchase_url || null,
      stream_safe,
      updated_at: Date.now()
    }, { new: true });

    console.log(`Record with ID ${id} updated: ${name} by ${artist}`);
    console.log(recordUpdated);
    return res.json({ record: recordUpdated.toJSON() });

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(400);
  }
}

const deleteRecord = async (req, res) => {
  const { token } = req.cookies;

  try {
    const { level } = jwt.verify(token, process.env.JWT_SECRET);
    if (level !== 'admin') throw new Error();

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(401);
  }

  try {
    const { id } = req.params;

    const recordDeleted = await Record.findByIdAndDelete(id);
    console.log(`Record with ID ${id} deleted: ${recordDeleted.name} by ${recordDeleted.artist}`);
    console.log(recordDeleted);
    return res.json({ record: recordDeleted.toJSON() });

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(400);
  }
}

const recordValidation = [
  body('*').trim(),
  body('name').notEmpty(),
  body('artist').notEmpty(),
  body('album_art').notEmpty().isURL({ protocols: ['http', 'https'] }),
  body('spotify_url').isURL({ protocols: ['http', 'https'] }),
  body('purchase_url').isURL({ protocols: ['http', 'https'] }),
  body('stream_safe').isBoolean(),
  body('created_at').isISO8601(),
  body('updated_at').isISO8601()
];

router.get('/', getRecords);
router.post('/', recordValidation, postRecord);
router.put('/:id', recordValidation, putRecord);
router.delete('/:id', deleteRecord);

module.exports = router;