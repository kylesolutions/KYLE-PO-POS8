import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './navicons.css'; // Create this CSS file for styling

function NavIcons() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClosingEntryNavigation = () => {
    const posOpeningEntry = localStorage.getItem('posOpeningEntry') || '';
    console.log('Navigating to Closing Entry with posOpeningEntry:', posOpeningEntry);
    navigate('/closingentry', { state: { posOpeningEntry } });
  };

  return (
    <div className="nav-icons-container">
      <ul className="nav flex-column">
        <li className="nav-item">
          <a
            className={`nav-link ${location.pathname === '/frontpage' ? 'active text-primary' : 'text-black'} cursor-pointer`}
            onClick={() => navigate('/frontpage')}
            title="Home"
          >
            <img src="/menuIcons/home.svg" alt="Home" className="menuicon" />
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${location.pathname === '/firsttab' ? 'active text-primary' : 'text-black'} cursor-pointer`}
            onClick={() => navigate('/firsttab')}
            title="Type Of Delivery"
          >
            <img src="/menuIcons/delivery.svg" alt="Delivery" style={{ width: "45px" }} />
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${location.pathname === '/table' ? 'active text-primary' : 'text-black'} cursor-pointer`}
            onClick={() => navigate('/table')}
            title="Table"
          >
            <img src="/menuIcons/table1.svg" alt="Table" style={{ width: "45px" }} />
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${location.pathname === '/kitchen' ? 'active text-primary' : 'text-black'} cursor-pointer`}
            onClick={() => navigate('/kitchen')}
            title="Kitchen"
          >
            <img src="/menuIcons/kitchen.svg" alt="Kitchen" className="menuicon" />
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${location.pathname === '/dispatch' ? 'active text-primary' : 'text-black'} cursor-pointer`}
            onClick={() => navigate('/dispatch')}
            title="Dispatch"
          >
            <img src="/menuIcons/dispatch.svg" alt="Dispatch" className="menuicon" />
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${location.pathname === '/dispatchorder' ? 'active text-primary' : 'text-black'} cursor-pointer`}
            onClick={() => navigate('/dispatchorder')}
            title="To Bill"
          >
            <img src="/menuIcons/dispatchorder.svg" alt="To Bill" className="menuicon" />
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${location.pathname === '/salesinvoice' ? 'active text-primary' : 'text-black'} cursor-pointer`}
            onClick={() => navigate('/salesinvoice')}
            title="Sales Invoice"
          >
            <img src="/menuIcons/save.svg" alt="Sales Invoice" className="menuicon" />
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${location.pathname === '/homedelivery' ? 'active text-primary' : 'text-black'} cursor-pointer`}
            onClick={() => navigate('/homedelivery')}
            title="Home Delivery Orders"
          >
            <img src="/menuIcons/homedelivery.svg" alt="Home Delivery Orders" className="menuicon" />
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${location.pathname === '/closingentry' ? 'active text-primary' : 'text-black'} cursor-pointer`}
            onClick={handleClosingEntryNavigation}
            title="Closing Entry"
          >
            <img src="/menuIcons/closingentry.svg" alt="Closing Entry" className="menuicon" />
          </a>
        </li>
      </ul>
    </div>
  );
}

export default NavIcons;