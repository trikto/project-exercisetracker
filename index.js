const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const mongoose = require("mongoose");
const bodyParser = require("body-parser");

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const logSchema = mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
});

const userSchema = mongoose.Schema({
  username: String,
  log: [logSchema],
});

const Users = mongoose.model("Users", userSchema);

app.post("/api/users", (req, res) => {
  const username = req.body.username;
  const user = new Users({
    username: username,
  });
  user
    .save()
    .then((data) => res.json({ username: data.username, _id: data._id }))
    .catch((err) => console.error(err));
});

app.post("/api/users/:id/exercises", (req, res) => {
  const id = req.params.id;
  const description = req.body.description;
  var date = req.body.date;

  if (date) {
    date = new Date(date);
  } else {
    date = new Date();
  }

  date = date.toDateString();
  const duration = parseInt(req.body.duration);
  Users.findByIdAndUpdate(id, {
    $push: {
      log: { description: description, date: date, duration: duration },
    },
  })
    .then((data) => {
      res.json({
        _id: data._id,
        username: data.username,
        date: date,
        duration: duration,
        description: description,
      });
    })
    .catch((err) => console.error(err));
});

app.get("/api/users", (req, res) => {
  Users.find()
    .then((data) => {
      let transformed_arr = data.map((val) => {
        return {
          _id: val.id,
          username: val.username,
        };
      });
      res.json(transformed_arr);
    })
    .catch((err) => console.error(err));
});

app.get("/api/users/:id/logs", (req, res) => {
  const id = req.params.id;
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;

  Users.findById(id)
    .then((data) => {
      // console.log("data", data);
      let log = data.log.sort((a, b) => new Date(a.date) - new Date(b.date));
      let filtered_arr = log;

      let response_object = {
        username: data.username,
      };

      if (from) {
        filtered_arr = log.filter(
          (val) => new Date(val.date) >= new Date(from)
        );
        response_object.from = from;
        // console.log(from, filtered_arr);
      }

      if (to) {
        filtered_arr = filtered_arr.filter(
          (val) => new Date(val.date) <= new Date(to)
        );
        response_object.to = to;
        // console.log(to, filtered_arr);
      }

      if (limit) {
        filtered_arr = filtered_arr.slice(0, parseInt(limit));
      }

      response_object.count = filtered_arr.length;
      response_object.log = filtered_arr;

      res.json(response_object);
    })
    .catch((err) => console.error(err));
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
