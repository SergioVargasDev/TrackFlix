const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  watchedMovies: [
    {
      imdbID: String,
      title: String,
      year: String,
      poster: String,
      imdbRating: Number,
      runtime: Number,
      userRating: Number,
      countRatingDecisions: Number,
    }
  ]
});

const UserModel = mongoose.model("users", UserSchema);

module.exports = UserModel;
