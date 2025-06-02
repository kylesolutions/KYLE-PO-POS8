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
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-white">
        <div className="container-fluid">
          <div className="user-info ms-auto pe-3">
            <div className="d-flex align-items-center">
              <img
                src="\menuIcons\poweroff.svg"
                alt="Logout"
                style={{ width: "18px" }}
                className="nav-link cursor-pointer"
                onClick={handleLogout}
              />
              <span className="ms-2 text-black mb-0">{user || "Guest"}</span>
            </div>
            <small className="d-block text-muted text-end mt-1">{formattedDate}</small>
            <small className="d-block text-muted text-end">{formattedTime}</small>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;