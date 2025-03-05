import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { persistor } from '../../Redux/store';
import { logout } from '../../Redux/Slices/userSlice';


function Navbar() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.user);
    const posProfile = useSelector((state) => state.user.posProfile); 

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

            if (response.ok && result.status === "success") {
                dispatch(logout());
                await persistor.purge();
                alert("Logout successful!");
                navigate("/");
            } else {
                console.error("Logout failed:", result);
                alert(`Logout failed: ${result.message || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Logout error:", error);
            alert("Failed to logout due to a network error.");
        }
    };

    return (
        <>
            <div>
                <nav className="navbar navbar-expand-lg navbar-light bg-white">
                    <div className="container-fluid">
                        <a className="navbar-brand text-black">
                            {user || "Guest"} {/* Should show "bearer1@gmail.com" after login */}
                        </a>
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
                        <div className="collapse navbar-collapse" id="navbarSupportedContent">
                            <div className="navbar-nav mx-auto text-center">
                                <a
                                    className="nav-link active text-black cursor-pointer"
                                    aria-current="page"
                                    onClick={() => navigate('/frontpage')}
                                >
                                    <i className="bi bi-house-fill fs-2"></i>
                                </a>
                                <a
                                    className="nav-link active text-black cursor-pointer"
                                    aria-current="page"
                                    onClick={() => navigate('/')}
                                >
                                    <i className="bi bi-menu-button-wide fs-2"></i>
                                </a>
                                <a
                                    className="nav-link active text-black cursor-pointer"
                                    aria-current="page"
                                    onClick={() => navigate('/table')}
                                >
                                    <i className="bi bi-border-all fs-2"></i>
                                </a>
                                <a
                                    className="nav-link active text-black cursor-pointer"
                                    aria-current="page"
                                    onClick={() => navigate('/kitchen')}
                                >
                                    <i className="bi bi-cup-hot fs-2"></i>
                                </a>
                                <a
                                    className="nav-link active text-black cursor-pointer"
                                    aria-current="page"
                                    onClick={() => navigate('/salesinvoice')}
                                >
                                    <i className="bi bi-save fs-2"></i>
                                </a>
                                <a
                                    className="nav-link active text-black cursor-pointer"
                                    aria-current="page"
                                    onClick={handleLogout}
                                    title="Logout"
                                >
                                    <i className="bi bi-box-arrow-right fs-2"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </nav>
            </div>
        </>
    );
}

export default Navbar;