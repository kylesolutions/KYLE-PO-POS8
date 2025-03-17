import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { persistor } from '../../Redux/store';
import { logout } from '../../Redux/Slices/userSlice';
import './navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation(); // To track current route
  const user = useSelector((state) => state.user.user);
  const posProfile = useSelector((state) => state.user.posProfile);
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

  const handleClosingEntryNavigation = () => {
    const posOpeningEntry = localStorage.getItem('posOpeningEntry') || '';
    console.log('Navigating to Closing Entry with posOpeningEntry:', posOpeningEntry);
    navigate('/closingentry', { state: { posOpeningEntry } });
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-white">
        <div className="container-fluid">
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
            <ul className="navbar-nav mb-2 mb-lg-0">
              <li className="nav-item">
                <a
                  className={`nav-link ${location.pathname === '/frontpage' ? 'active text-primary' : 'text-black'} cursor-pointer`}
                  onClick={() => navigate('/frontpage')}
                  title="Home"
                >
                  <img src="/menuIcons/home.svg" alt="" className='menuicon' />
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${location.pathname === '/firsttab' ? 'active text-primary' : 'text-black'} cursor-pointer`}
                  onClick={() => navigate('/firsttab')}
                  title="Type Of Delivery"
                >
                  <img src="/menuIcons/delivery.svg" alt="" style={{ width:"45px" }}/>
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${location.pathname === '/table' ? 'active text-primary' : 'text-black'} cursor-pointer`}
                  onClick={() => navigate('/table')}
                  title="Table"
                >
                  <img src="/menuIcons/table1.svg" alt="" style={{ width:"45px" }} />
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${location.pathname === '/kitchen' ? 'active text-primary' : 'text-black'} cursor-pointer`}
                  onClick={() => navigate('/kitchen')}
                  title="Kitchen"
                >
                  <img src="/menuIcons/kitchen.svg" alt="" className='menuicon' />
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${location.pathname === '/salesinvoice' ? 'active text-primary' : 'text-black'} cursor-pointer`}
                  onClick={() => navigate('/salesinvoice')}
                  title="Sales Invoice"
                >
                  <img src="\menuIcons\save.svg" alt="" className='menuicon' />
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${location.pathname === '/closingentry' ? 'active text-primary' : 'text-black'} cursor-pointer`}
                  onClick={handleClosingEntryNavigation}
                  title="Closing Entry"
                >
                   <img src="\menuIcons\closingentry.svg" alt="" className='menuicon' />
                </a>
              </li>
            </ul>

            <div className="user-info ms-auto pe-3">
              <div className="d-flex align-items-center">
                <img src="\menuIcons\poweroff.svg" alt="" style={{width:"18px"}} className={`nav-link ${location.pathname === '/logout' ? 'active text-primary' : 'text-black'} cursor-pointer`}
                  onClick={handleLogout}/>
                <span className="ms-2 text-black mb-0">{user || "Guest"}</span>
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