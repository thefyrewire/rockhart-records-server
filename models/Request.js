const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RequestSchema = new Schema({
  record: {
    type: Object,
    required: true
  },
  user: {
    type: Object,
    required: true
  },
  created_at: {
    type: Date,
    required: true
  }
});

RequestSchema.set('toJSON', {
  transform: (doc, ret, opt) => {
    const retJSON = {
      id: ret._id,
      record: ret.record,
      user: ret.user,
      created_at: ret.created_at
    }
    return retJSON;
  }
});

module.exports = Request = mongoose.model('request', RequestSchema);