import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { persistor } from '../../Redux/store';
import { logout } from '../../Redux/Slices/userSlice';
import './navbar.css'; // Assuming you’ll add the CSS file

function Navbar() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.user);
    const posProfile = useSelector((state) => state.user.posProfile);

    console.log("Redux User State in Navbar:", useSelector((state) => state.user));

    // State for current date and time
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); // Update every second
        return () => clearInterval(timer); // Cleanup on unmount
    }, []);

    // Format date as "Month Date, Year" (e.g., "March 09, 2025")
    const formattedDate = currentTime.toLocaleDateString('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric',
    });

    // Format time as "HH:MM:SS AM/PM" (e.g., "11:45:23 PM")
    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const handleLogout = async () => {
        try {
            const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.user_logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "token 0bde704e8493354:5709b3ab1a1cb1a",
                },
            });

            const result = await response.json();
            console.log("Logout Response:", result);

            if (response.ok && result.message?.status === "success") {
                dispatch(logout());
                await persistor.purge();
                alert("Logout successful!");
                navigate("/");
            } else {
                console.error("Logout failed:", result);
                alert(`Logout failed: ${result.message?.message || result.message || "Unknown error"}`);
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
                    {/* Navbar Toggler */}
                    <button
                        className="navbar-toggler bg-light"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarSupportedContent"
                        aria-controls="navbarSupportedContent"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    {/* Navigation Links and User Info */}
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        {/* Centered Navigation Links */}
                        <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <a className="nav-link active text-black cursor-pointer" onClick={() => navigate('/frontpage')}>
                                    <i className="bi bi-house-fill fs-2"></i>
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link active text-black cursor-pointer" title="Type Of Delivery" onClick={() => navigate('/firsttab')}>
                                    <i className="bi bi-menu-button-wide fs-2"></i>
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link active text-black cursor-pointer" title="Table" onClick={() => navigate('/table')}>
                                    <i className="bi bi-border-all fs-2"></i>
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link active text-black cursor-pointer" onClick={() => navigate('/kitchen')}>
                                    <i className="bi bi-cup-hot fs-2"></i>
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link active text-black cursor-pointer" onClick={() => navigate('/salesinvoice')}>
                                    <i className="bi bi-save fs-2"></i>
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link active text-black cursor-pointer" onClick={handleLogout} title="Logout">
                                    <i className="bi bi-box-arrow-right fs-2"></i>
                                </a>
                            </li>
                        </ul>

                        {/* User Info on the Right */}
                        <div className="user-info ms-auto pe-3">
                            <div className="d-flex align-items-center">
                                <i className="bi bi-person-circle fs-4 me-2"></i>
                                <span className="fw-bold text-black mb-0">{user || "Guest"}</span>
                            </div>
                            <small className="d-block text-muted text-end mt-1">{formattedDate}</small>
                            <small className="d-block text-muted text-end">{formattedTime}</small>
                        </div>
                    </div>
                </div>
            </nav>
        </div>
    );
}

export default Navbar;