import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@mui/material";

function Logout({ setIsLoggedIn }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    axios  
      .post(`${process.env.REACT_APP_BACKEND_URL}/logout`, {}, { withCredentials: true })  // Correct usage of process.env
      .then((response) => {
        if (response.status === 200) {
          setIsLoggedIn(false);
          navigate("/login");
        }
      })
      .catch((error) => {
        console.error("Error logging out:", error);
      });
  };
  
  const button = {
    marginRight: "20px",
    fontSize: "1.2rem",
    fontWeight: "700",
    padding: "0.3rem 1.4rem",
  };

  return (
    <Button
      variant="contained"
      color="error"
      style={button}
      onClick={handleLogout}
    >
      Logout
    </Button>
  );
}

export default Logout;
