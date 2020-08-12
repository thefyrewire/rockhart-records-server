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
  stream_safe_only: {
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
      stream_safe_only: ret.stream_safe_only,
      max_user_requests: ret.max_user_requests,
      max_total_requests: ret.max_total_requests
    }
    return retJSON;
  }
});

module.exports = Settings = mongoose.model('settings', SettingsSchema);