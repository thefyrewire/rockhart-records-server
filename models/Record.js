const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RecordSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    required: true
  },
  album_art: {
    type: String,
    required: true
  },
  spotify_url: {
    type: String
  },
  purchase_url: {
    type: String
  },
  stream_safe: {
    type: Boolean,
    required: true,
    default: false
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

RecordSchema.set('toJSON', {
  transform: (doc, ret, opt) => {
    const retJSON = {
      id: ret._id,
      name: ret.name,
      artist: ret.artist,
      album_art: ret.album_art,
      spotify_url: ret.spotify_url,
      purchase_url: ret.purchase_url,
      stream_safe: ret.stream_safe,
      created_at: ret.created_at,
      updated_at: ret.updated_at
    }
    return retJSON;
  }
});

module.exports = Record = mongoose.model('record', RecordSchema);