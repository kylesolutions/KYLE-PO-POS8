import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Truck, 
  Table, 
  ChefHat, 
  Send, 
  FileText, 
  MapPin, 
  CheckCircle, 
  Receipt, 
  DoorClosed 
} from 'lucide-react';
import './navicons.css';

function NavIcons() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClosingEntryNavigation = () => {
    const posOpeningEntry = localStorage.getItem('posOpeningEntry') || '';
    console.log('Navigating to Closing Entry with posOpeningEntry:', posOpeningEntry);
    navigate('/closingentry', { state: { posOpeningEntry } });
  };

  const navItems = [
    {
      path: '/frontpage',
      icon: Home,
      title: 'Home',
      label: 'Home'
    },
    {
      path: '/firsttab',
      icon: Truck,
      title: 'Type Of Delivery',
      label: 'Delivery'
    },
    {
      path: '/table',
      icon: Table,
      title: 'Table',
      label: 'Table'
    },
    {
      path: '/kitchen',
      icon: ChefHat,
      title: 'Kitchen',
      label: 'Kitchen'
    },
    {
      path: '/dispatch',
      icon: Send,
      title: 'Dispatch',
      label: 'Dispatch'
    },
    {
      path: '/dispatchorder',
      icon: FileText,
      title: 'To Bill',
      label: 'To Bill'
    },
    {
      path: '/homedelivery',
      icon: MapPin,
      title: 'Home Delivery Orders',
      label: 'Delivery'
    },
    {
      path: '/deliveryorders',
      icon: CheckCircle,
      title: 'Delivered Orders',
      label: 'Delivered'
    },
    {
      path: '/salesinvoice',
      icon: Receipt,
      title: 'Sales Invoice',
      label: 'Invoice'
    },
    {
      path: '/closingentry',
      icon: DoorClosed,
      title: 'Closing Entry',
      label: 'Closing',
      onClick: handleClosingEntryNavigation
    }
  ];

  return (
    <div className="nav-icons-container">
      <div className="nav-brand">
        <div className="brand-icon">
          <Home size={24} />
        </div>
      </div>
      
      <nav className="nav-menu">
        <ul className="nav-list">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path} className="nav-item">
                <button
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  onClick={item.onClick || (() => navigate(item.path))}
                  title={item.title}
                  aria-label={item.title}
                >
                  <div className="nav-icon">
                    <IconComponent size={20} />
                  </div>
                  <span className="nav-label">{item.label}</span>
                  {isActive && <div className="active-indicator"></div>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="nav-footer">
        <div className="status-indicator">
          <div className="status-dot"></div>
          <span className="status-text">Online</span>
        </div>
      </div>
    </div>
  );
}

export default NavIcons;