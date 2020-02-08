const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const ky = require('ky-universal');
require('dotenv').config();

const oauth2 = {
  client: {
    id: process.env.CLIENT_ID,
    secret: process.env.CLIENT_SECRET
  },
  path: {
    authorize: 'https://id.twitch.tv/oauth2/authorize',
    token: 'https://id.twitch.tv/oauth2/token',
    callback: 'http://localhost:3001/auth/callback'
  }
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  io.emit('connected');
});

http.listen(3001, () => {
  console.log('listening on *:3001');
});

// redirect user to authorize screen
const auth = (req, res) => {
  const authorizationUri = `${oauth2.path.authorize}?client_id=${oauth2.client.id}&redirect_uri=${encodeURIComponent(oauth2.path.callback)}&response_type=code`;

  res.redirect(authorizationUri);
}

// exchange the auth code for a token
const callback = async (req, res) => {
  const code = req.query.code;
  console.log(`Code: ${code}`);

  try {
    const response = await ky.post(`${oauth2.path.token}?client_id=${oauth2.client.id}&client_secret=${oauth2.client.secret}&code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(oauth2.path.callback)}`, { headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}}).json();
    console.log(`Access token: ${response.access_token}`);

  } catch (error) {
    console.log(`Access token error: ${error.message}`);
  }
}

// load static resources
app.use('/css', express.static(__dirname + '/public/css/'));

// bind routes to functions
app.get('/auth', auth);
app.get('/auth/callback', callback);