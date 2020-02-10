const express = require('express');
const router = express.Router();

const ky = require('ky-universal');
const jwt = require('jsonwebtoken');
const uidgenerator = require('uid-generator');
const uidgen = new uidgenerator();
require('dotenv').config();

const User = require('../models/User');

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

// redirect user to authorize screen
const login = async (req, res) => {
  const nonce = {
    token: await uidgen.generate(),
    redirect: req.query.next || 'http://localhost:3000/dashboard'
  }
  const state = jwt.sign(nonce, process.env.JWT_AUTHCODE_SECRET, { expiresIn: '1m', issuer: process.env.JWT_ISSUER });
  const authorizationUri = `${oauth2.path.authorize}?client_id=${oauth2.client.id}&redirect_uri=${encodeURIComponent(oauth2.path.callback)}&response_type=code&state=${state}`;

  res.redirect(authorizationUri);
}

// log the user out by destroying the cookie
const logout = async (req, res) => {
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

  try {
    const response = await ky.post(`${oauth2.path.token}?client_id=${oauth2.client.id}&client_secret=${oauth2.client.secret}&code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(oauth2.path.callback)}`, { headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}}).json();

    const { data } = await ky.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${response.access_token}`,
        'Client-ID': process.env.CLIENT_ID
      }
    }).json();

    if (data.length <= 0) throw new Error('User does not exist');

    const profile = data[0];

    const userData = {
      user_name: profile.display_name,
      user_id: profile.id,
      level: process.env.ADMINS.split(',').map(u => u.toLowerCase()).indexOf(profile.display_name.toLowerCase()) !== -1 ? 'admin' : 'user',
      api_token: await uidgen.generate()
    }

    const userExists = await User.find({ user_id: profile.id });
    
    // if user exists, update api_token and updated_at
    if (userExists.length > 0) {
      const _id = userExists[0]._id;
      console.log(`User: ${userData.user_name} already exists, updating...`);
      await User.findByIdAndUpdate(_id, { ...userData, updated_at: Date.now() });
      userData.id = _id;

    // otherwise create a new user with new ID
    } else {
      const user = new User({
        ...userData,
        created_at: Date.now(),
        updated_at: Date.now()
      });

      const userSaved = await user.save();
      userData.id = userSaved._id;
      console.log(`New user: ${userData.user_name} saved!`);
      console.log(userSaved);
    }

    const jwt_token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '12h', issuer: process.env.JWT_ISSUER });

    res.cookie('token', jwt_token, { secure: false, httpOnly: true }); // set secure to true when on HTTPS
    res.redirect(next);

  } catch (error) {
    console.log(`Auth error: ${error.message}`);
    res.redirect('http://localhost:3000?error=Unauthorised-BadAuth');
  }
}

router.get('/login', login);
router.get('/callback', callback);
router.get('/logout', logout);

module.exports = router;