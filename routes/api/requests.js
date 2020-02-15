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
  },
  promote: function(id) {
    const index = this.queue.findIndex(request => request.id.toString() === id);
    if (index === -1) return;
    this.queue.unshift(...this.queue.splice(index, 1));
    return;
  },
  delete: function(id) {
    this.queue = this.queue.filter(request => request.id.toString() !== id);
    return;
  }
}

const getRequests = (req, res) => {
  res.json(Requests.queue);
}

const postRequest = async (req, res) => {
  const { token } = req.cookies;
  let user;

  try {
    user = jwt.verify(token, process.env.JWT_SECRET);

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(401);
  }

  try {
    const { id } = req.params;
    const io = req.app.get('socketio');

    const record = await Record.findById(id);
    if (!record) throw new Error();

    const request = new Request({
      record: record.toJSON(),
      user: { id: user.id, user_name: user.user_name, user_id: user.user_id },
      created_at: Date.now()
    });

    const requestCreated = await request.save().then(d => d.toJSON());
    console.log(requestCreated);

    Requests.add(requestCreated);
    io.sockets.emit('new-request', requestCreated);

    // return res.json(requestCreated);
    return res.sendStatus(200);

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(404);
  }
}

const promoteRequest = async (req, res) => {
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
    const io = req.app.get('socketio');

    Requests.promote(id);
    io.sockets.emit('promote-request', id);
    return res.sendStatus(200);

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(400);
  }
}

const deleteRequest = async (req, res) => {
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
    const io = req.app.get('socketio');

    Requests.delete(id);
    io.sockets.emit('delete-request', id);
    return res.sendStatus(200);

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(400);
  }
}

router.get('/', getRequests);
router.post('/new/:id', postRequest);
router.put('/promote/:id', promoteRequest);
router.delete('/:id', deleteRequest);

// module.exports = router;
module.exports = router;