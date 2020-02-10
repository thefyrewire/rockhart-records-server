const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  user_name: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
  level: {
    type: String,
    required: true
  },
  api_token: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    required: true
  },
  updated_at: {
    type: Date,
    required: true
  }
});

module.exports = User = mongoose.model('user', UserSchema);