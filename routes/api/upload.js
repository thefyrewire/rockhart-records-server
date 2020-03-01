const express = require('express');
const router = express.Router();

require('dotenv').config();
const jwt = require('jsonwebtoken');

const fs = require('fs');
const formidable = require('formidable');
const { createClient } = require('webdav');
const client = createClient(process.env.WEBDAV_PATH, {
  username: process.env.WEBDAV_USERNAME,
  password: process.env.WEBDAV_PASSWORD,
  digest: true
});

const postUpload = async (req, res) => {
  const { token } = req.cookies;

  try {
    const { level } = jwt.verify(token, process.env.JWT_SECRET);
    if (level !== 'admin') throw new Error();

    try {
      // const contents = await client.getDirectoryContents('/content/records');
      // console.log(contents);

      const form = formidable();
      form.parse(req);
      form.on('file', async (name, file) => {
        fs.readFile(file.path, async (err, data) => {
          const buffer = new Uint8Array(data);
          console.log(`uploading ${file.name} to webdav...`);
          await client.putFileContents(`/content/records/${file.name}`, buffer);
          return res.json({ path: `https://rockhartclothing.com/content/records/${file.name}` });
        });
      });
    
    } catch (err) {
      console.log(err);
      throw new Error();
    }

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(401);
  }
}

router.post('/', postUpload);

module.exports = router;