const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SettingsSchema = new Schema({
  requests_enabled: {
    type: Boolean,
    required: true,
    default: false
  },
  allow_duplicates: {
    type: Boolean,
    required: true,
    default: false
  },
  max_user_requests: {
    type: Number,
    required: true,
    default: 5
  },
  max_total_requests: {
    type: Number,
    required: true,
    default: 50
  }
});

SettingsSchema.set('toJSON', {
  transform: (doc, ret, opt) => {
    const retJSON = {
      requests_enabled: ret.requests_enabled,
      allow_duplicates: ret.allow_duplicates,
      max_user_requests: ret.max_user_requests,
      max_total_requests: ret.max_total_requests
    }
    return retJSON;
  }
});

module.exports = Settings = mongoose.model('settings', SettingsSchema);