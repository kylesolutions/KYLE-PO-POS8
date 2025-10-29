import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { persistor } from '../../Redux/store';
import { logout } from '../../Redux/Slices/userSlice';
import './navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.user_logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
        },
      });
      const result = await response.json();
      console.log("Logout Response:", result);

      if (response.ok && result.message?.status === "success") {
        dispatch(logout());
        await persistor.purge();
        localStorage.clear();
        alert("Logout successful!");
        navigate("/");
      } else {
        alert(`Logout failed: ${result.message?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout due to a network error.");
    }
  };

  return (
    <nav className="modern-navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1 className="brand-title">Restaurant POS</h1>
        </div>

        <div className="navbar-user-section">
          <div className="user-info-card">
            <div className="user-details">
              <div className="user-name-wrapper">
                <i className="bi bi-person-circle user-icon"></i>
                <span className="user-name">{user || "Guest"}</span>
              </div>
              <div className="datetime-wrapper">
                <span className="date-text">{formattedDate}</span>
                <span className="time-text">{formattedTime}</span>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <i className="bi bi-power"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
