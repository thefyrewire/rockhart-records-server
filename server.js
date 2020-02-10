const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');
const io = require('socket.io')(http);
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const routes = require('./routes');

require('dotenv').config();
app.use(cookieParser());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected');
  io.emit('connected');
});

// connect to MongoDB and start server
(async () => {
  try {
    const connected = await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
    console.log('Connected to MongoDB...');
  } catch (err) {
    console.log(err);
  }

  http.listen(5000, () => {
    console.log('listening on *:5000');
  });
})();

// load static resources
app.use('/css', express.static(__dirname + '/public/css/'));

// use routes
app.use(routes);