import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import "./index.css";
import App from "./App";
import Login from "./Login";
import SignUp from "./SignUp";
import { NavBarAuth } from "./NavBarAuth";

// Conditionally render the navbar only for login and signup routes
const ConditionalNavBar = ({ isLoggedIn, setIsLoggedIn }) => {
  const location = useLocation();

  // Show NavBarAuth only on /login and /signup pages
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return <NavBarAuth isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />;
  }
  return null;
};

const RootComponent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    // Load login state from localStorage, fallback to false
    () => JSON.parse(localStorage.getItem("isLoggedIn")) || false
  );

  // Save login state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("isLoggedIn", JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  console.log("Is user logged in?", isLoggedIn); // Debugging: Check if the state is correct

  return (
    <Router>
      <ConditionalNavBar
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
      />

      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn ? <Navigate to="/home" /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/login"
          element={<Login setIsLoggedIn={setIsLoggedIn} />}
        />
        <Route path="/signup" element={<SignUp />} />

        <Route
          path="/home"
          element={
            isLoggedIn ? (
              <App setIsLoggedIn={setIsLoggedIn} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);
