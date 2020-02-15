const express = require('express');
const router = express.Router();

require('dotenv').config();
const jwt = require('jsonwebtoken');

const Record = require('../../models/Record');
const Request = require('../../models/Request');

const Requests = {
  queue: [],
  add: function(record) {
    this.queue.push(record);
    return;
  },
  next: function() {
    return this.queue.shift(); 
  }
}

const getRequests = (req, res) => {
  res.json(Requests.queue);
}

const postRequest = async (req, res) => {
  const { token } = req.cookies;
  const io = req.app.get('socketio');

  let user;

  try {
    user = jwt.verify(token, process.env.JWT_SECRET);

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(401);
  }

  try {
    const { id } = req.params;

    const record = await Record.findById(id);
    if (!record) throw new Error();

    // const request = {
    //   record: record.toJSON(),
    //   user: { user_name: user.user_name, user_id: user.user_id },
    //   created_at: new Date().toISOString()
    // }

    const request = new Request({
      record: record.toJSON(),
      user: { id: user.id, user_name: user.user_name, user_id: user.user_id },
      created_at: Date.now()
    });

    const requestCreated = await request.save().then(d => d.toJSON());
    console.log(requestCreated);

    Requests.add(requestCreated);
    // io.sockets.emit('new-request', requestCreated);

    // return res.json(requestCreated);
    return res.sendStatus(200);

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(404);
  }
}

router.get('/', getRequests);
router.post('/new/:id', postRequest);
// router.delete('/:id', deleteRecord);

// module.exports = router;
module.exports = router;