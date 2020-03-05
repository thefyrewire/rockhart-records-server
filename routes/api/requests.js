const express = require('express');
const router = express.Router();

require('dotenv').config();
const jwt = require('jsonwebtoken');

const Record = require('../../models/Record');
const Request = require('../../models/Request');
const Settings = require('../../models/Settings');

const Requests = {
  queue: [],
  current: null,
  history: [],
  add: function(record) {
    this.queue.push(record);
    return;
  },
  next: function() {
    this.history = this.current
      ? [...this.history, this.current].sort((a, b) => new Date(a.updated_at) < new Date(b.updated_at)).slice(0, 10)
      : this.history;
    this.current = { ...this.queue.shift(), updated_at: new Date().toISOString() };
    console.log(this.current);
    return this.current;
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
  },
  clearCurrent: function() {
    const current = this.current;
    this.history = [...this.history, current].sort((a, b) => new Date(a.updated_at) < new Date(b.updated_at)).slice(0, 20);
    this.current = null;
    return current;
  },
  has: function(record_id) {
    return this.queue.findIndex(request => request.record.id.toString() === record_id) !== -1;
  },
  byUser: function(user_id) {
    return this.queue.filter(request => request.user.id === user_id).length;
  },
  clearHistory: function() {
    this.history = [];
    return;
  }
}

const getRequests = (req, res) => {
  res.json({
    requests: Requests.queue,
    current: Requests.current,
    history: Requests.history.slice(0, 10)
  });
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

    const settings = await Settings.findOne();
    if (!settings.requests_enabled) throw new Error('Requests are disabled');
    if (!settings.allow_duplicates && Requests.has(id)) throw new Error('Record already requested');
    if (settings.max_user_requests !== 0 && Requests.byUser(user.id) >= settings.max_user_requests) throw new Error('Maximum user requests made');
    if (settings.max_total_requests !== 0 && Requests.queue.length >= settings.max_total_requests) throw new Error('Maximum total requests made');

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
    return res.sendStatus(403);
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

const nextRequest = (req, res) => {
  const { token } = req.cookies;

  try {
    const { level } = jwt.verify(token, process.env.JWT_SECRET);
    if (level !== 'admin') throw new Error();

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(401);
  }

  try {
    const io = req.app.get('socketio');

    const request = Requests.next();
    const history = Requests.history;
    io.sockets.emit('next-request', { request, history });
    return res.sendStatus(200);

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(400);
  }
}

const clearCurrentRequest = (req, res) => {
  const { token } = req.cookies;

  try {
    const { level } = jwt.verify(token, process.env.JWT_SECRET);
    if (level !== 'admin') throw new Error();

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(401);
  }

  try {
    const io = req.app.get('socketio');

    const request = Requests.clearCurrent();
    io.sockets.emit('clear-current-request', request);
    return res.sendStatus(200);

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(400);
  }
}

const deleteHistory = (req, res) => {
  const { token } = req.cookies;

  try {
    const { level } = jwt.verify(token, process.env.JWT_SECRET);
    if (level !== 'admin') throw new Error();

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(401);
  }

  try {
    const io = req.app.get('socketio');

    const request = Requests.clearHistory();
    io.sockets.emit('clear-history');
    return res.sendStatus(200);

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(400);
  }
}

router.get('/', getRequests);
router.post('/new/:id', postRequest);
router.put('/promote/:id', promoteRequest);
router.delete('/history', deleteHistory);
router.delete('/:id', deleteRequest);
router.put('/next', nextRequest);
router.put('/current/clear', clearCurrentRequest);

module.exports = router;