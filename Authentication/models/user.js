const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  password: String,
  username: String,
  name: String,
  surname: String,
  email: String,
  level: String,
  active: Boolean,
  dateCreated: String,
  dateLastAccess: String,
  providerId: String,
  provider: String,
  history: [Number],
  favorites: [{
    id: Number,
    description: String
  }]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('user', userSchema);