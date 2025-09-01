import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import './design2Nav.css';

function Design2Nav() {
  const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="nav-icons-container">
            <div>
                <img src="/images/logo.png" alt="Logo" style={{ width: "100px", display: "flex", justifyContent: "center" }} className="mx-auto" />
                <ul className="nav flex-column">
                    <li className="nav-item">
                        <i 
                            className={`bi bi-house-door-fill nav-link ${location.pathname === '/' ? 'active text-primary' : 'text-black'} cursor-pointer`} 
                            onClick={() => navigate('/')}
                        ></i>
                    </li>
                    <li className="nav-item">
                        <i 
                            className={`bi bi-archive-fill nav-link ${location.pathname === '/archive' ? 'active text-primary' : 'text-black'} cursor-pointer`} 
                            onClick={() => navigate('/archive')}
                        ></i>
                    </li>
                    <li className="nav-item">
                        <i 
                            className={`bi bi-backpack nav-link ${location.pathname === '/backpack' ? 'active text-primary' : 'text-black'} cursor-pointer`} 
                            onClick={() => navigate('/backpack')}
                        ></i>
                    </li>
                    <li className="nav-item">
                        <i 
                            className={`bi bi-bar-chart-line-fill nav-link ${location.pathname === '/charts' ? 'active text-primary' : 'text-black'} cursor-pointer`} 
                            onClick={() => navigate('/charts')}
                        ></i>
                    </li>
                    <li className="nav-item">
                        <i 
                            className={`bi bi-bookmark-fill nav-link ${location.pathname === '/bookmarks' ? 'active text-primary' : 'text-black'} cursor-pointer`} 
                            onClick={() => navigate('/bookmarks')}
                        ></i>
                    </li>
                </ul>
            </div>
            <div>
                <ul className="nav flex-column">
                    <li className="nav-item">
                        <i 
                            className={`bi bi-gear-fill nav-link ${location.pathname === '/settings' ? 'active text-primary' : 'text-black'} cursor-pointer`} 
                            onClick={() => navigate('/settings')}
                        ></i>
                    </li>
                    <li className="nav-item">
                        <i 
                            className={`bi bi-box-arrow-left nav-link ${location.pathname === '/logout' ? 'active text-primary' : 'text-black'} cursor-pointer`} 
                            onClick={() => navigate('/logout')}
                        ></i>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default Design2Nav