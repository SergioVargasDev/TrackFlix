const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const UserModel = require("./model/User");

dotenv.config();
const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000", // Your frontend URL
    credentials: true, // This is necessary to allow sending cookies from frontend to backend
  })
);

// Configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secretkey", // A secret for signing the session ID
    resave: false,
    saveUninitialized: false, // Prevents uninitialized sessions from being saved
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, // MongoDB connection URI
    }),
    cookie: {
      secure: false, // Ensure this is false in development (for HTTP). Set to true for HTTPS.
      httpOnly: true, // Helps mitigate XSS attacks
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

// Signup route
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({ name, email, password: hashedPassword });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login route with session handling
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json("No Records found");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json("Password doesn't match");
    }

    // Set session for the logged-in user
    req.session.user = { id: user._id, name: user.name, email: user.email };
    console.log("Session created:", req.session.user);
    res.json("Success");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout route
app.post("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.status(200).json("Logout successful");
    });
  } else {
    res.status(400).json({ error: "No session found" });
  }
});

// Fetch user session details
app.get("/user", (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json("Not authenticated");
  }
});


app.post("/add-movie", async (req, res) => {
  const { email, movie } = req.body;
  try {
    // Find the user by email and update their watched movies list
    const user = await UserModel.findOneAndUpdate(
      { email },
      { $push: { watchedMovies: movie } },
      { new: true }
    );
    console.log(user);  // Debug: Check if user is found and updated
    res.status(200).json(user.watchedMovies);
  } catch (error) {
    console.error("Error adding movie to DB:", error);
    res.status(500).json({ error: error.message });
  }
});


app.post("/remove-movie", async (req, res) => {
  const { email, imdbID } = req.body;  // The frontend will send the email and movie's imdbID
  try {
    const user = await UserModel.findOneAndUpdate(
      { email },
      { $pull: { watchedMovies: { imdbID } } },
      { new: true }
    );
    res.status(200).json(user.watchedMovies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/user-movies", async (req, res) => {
  const { email } = req.query;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json([]);
    }
    res.status(200).json(user.watchedMovies || []);  // Always return an array
  } catch (error) {
    res.status(500).json([]);  // Return an empty array in case of error
  }
});
