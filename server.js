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
const authLogin = async (req, res) => {
  const nonce = {
    token: await uidgen.generate(),
    redirect: req.query.next || 'http://localhost:3000/dashboard'
  }
  const state = jwt.sign(nonce, process.env.JWT_AUTHCODE_SECRET, { expiresIn: '1m', issuer: process.env.JWT_ISSUER });
  const authorizationUri = `${oauth2.path.authorize}?client_id=${oauth2.client.id}&redirect_uri=${encodeURIComponent(oauth2.path.callback)}&response_type=code&state=${state}`;

  res.redirect(authorizationUri);
}

// log the user out by destroying the cookie
const authLogout = async (req, res) => {
  res.cookie('token', '', { expires: new Date(1), path: '/' });
  res.redirect('http://localhost:3000');
}

// exchange the auth code for a token
const callback = async (req, res) => {
  const state = req.query.state;
  let next = 'http://localhost:3000/dashboard';

  try {
    const decoded = await jwt.verify(state, process.env.JWT_AUTHCODE_SECRET);
    next = decoded.redirect;

  } catch (error) {
    console.log(error.message);
    res.redirect('http://localhost:3000?error=Unauthorised-BadState');
    return;
  }

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

    res.cookie('token', jwt_token, { secure: false, httpOnly: true }); // set secure to true when on HTTPS
    res.redirect(next);

  } catch (error) {
    console.log(`Access token error: ${error.message}`);
    res.redirect('http://localhost:3000?error=Unauthorised-BadAuth');
  }
}

// validate JWT token in cookie
const me = (req, res) => {
  const { token } = req.cookies;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.statusCode = 200;
    res.json({ authenticated: true, user: { name: decoded.user_name, id: decoded.user_id, level: decoded.level } });

  } catch (error) {
    console.error(error.message);
    res.statusCode = 401;
    res.json({ authenticated: false, user: null });
  }
}

// load static resources
app.use('/css', express.static(__dirname + '/public/css/'));

// bind routes to functions
app.get('/auth/login', authLogin);
app.get('/auth/logout', authLogout);
app.get('/auth/callback', callback);
app.get('/auth/me', me);