const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');
const io = require('socket.io')(http);
const ky = require('ky-universal');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const uidgenerator = require('uid-generator');
require('dotenv').config();

app.use(cookieParser());
const uidgen = new uidgenerator();

const oauth2 = {
  client: {
    id: process.env.CLIENT_ID,
    secret: process.env.CLIENT_SECRET
  },
  path: {
    authorize: 'https://id.twitch.tv/oauth2/authorize',
    token: 'https://id.twitch.tv/oauth2/token',
    callback: 'http://localhost:5000/auth/callback'
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected');
  io.emit('connected');
});

http.listen(5000, () => {
  console.log('listening on *:5000');
});

// redirect user to authorize screen
const auth = (req, res) => {
  const authorizationUri = `${oauth2.path.authorize}?client_id=${oauth2.client.id}&redirect_uri=${encodeURIComponent(oauth2.path.callback)}&response_type=code`;

  res.redirect(authorizationUri);
}

// exchange the auth code for a token
const callback = async (req, res) => {
  console.log(req.cookies);

  const code = req.query.code;
  console.log(`Code: ${code}`);

  try {
    const response = await ky.post(`${oauth2.path.token}?client_id=${oauth2.client.id}&client_secret=${oauth2.client.secret}&code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(oauth2.path.callback)}`, { headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}}).json();
    console.log(`Access token: ${response.access_token}`);

    const token = await uidgen.generate();
    const jwt_token = jwt.sign({
      token: token,
      user_name: 'thefyrewire',
      user_id: '48745558',
      level: 'admin',
    }, process.env.JWT_SECRET, { expiresIn: '12h', issuer: process.env.JWT_ISSUER });

    console.log(`Token: ${token}`);
    console.log(`JWT: ${jwt_token}`);

    res.cookie('token', jwt_token, { httpOnly: true });
    res.redirect('http://localhost:3000');

  } catch (error) {
    console.log(`Access token error: ${error.message}`);
  }
}

// test endpoint
const test = (req, res) => {
  res.json(['foo', 'bar']);
}

// validate JWT token in cookie
const validate = (req, res) => {
  const { token } = req.cookies;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded: ', decoded);
    res.json({ authenticated: true });
    
  } catch (error) {
    console.log(error.message);
    res.json({ authenticated: false });
  }
}

// load static resources
app.use('/css', express.static(__dirname + '/public/css/'));

// bind routes to functions
app.get('/auth', auth);
app.get('/auth/callback', callback);
app.get('/api/test', test);
app.get('/auth/validate', validate);