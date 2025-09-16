import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Utensils, Truck, Calendar } from 'lucide-react';
import './firsttab.css';

function FirstTab() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { posOpeningEntry } = state || {};
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeliveryTypes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_typesOf_delivery', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
          },
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        console.log("Delivery Types Response:", data);

        if (data.message && Array.isArray(data.message)) {
          const types = data.message.map(item => item.types_of_delivery);
          setDeliveryTypes(types);
        } else {
          setDeliveryTypes(["TAKE AWAY", "DINE IN", "ONLINE DELIVERY", "TABLE BOOKING"]);
        }
      } catch (error) {
        console.error("Error fetching delivery types:", error);
        setError("Failed to load delivery types. Using default options.");
        setDeliveryTypes(["TAKE AWAY", "DINE IN", "ONLINE DELIVERY", "TABLE BOOKING"]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeliveryTypes();
  }, []);

  const handleNavigation = (type) => {
    const nextPath = ["DINE IN", "TABLE BOOKING"].includes(type.toUpperCase()) ? '/table' : '/frontpage';
    navigate(nextPath, { state: { deliveryType: type.toUpperCase(), posOpeningEntry } });
  };

  const getDeliveryIcon = (type) => {
    const normalizedType = type.toUpperCase();
    switch (normalizedType) {
      case 'TAKE AWAY':
        return <ShoppingBag size={32} />;
      case 'DINE IN':
        return <Utensils size={32} />;
      case 'ONLINE DELIVERY':
        return <Truck size={32} />;
      case 'TABLE BOOKING':
        return <Calendar size={32} />;
      default:
        return <ShoppingBag size={32} />;
    }
  };

  const getDeliveryDescription = (type) => {
    const normalizedType = type.toUpperCase();
    switch (normalizedType) {
      case 'TAKE AWAY':
        return 'Order and pick up at the store';
      case 'DINE IN':
        return 'Enjoy your meal in our restaurant';
      case 'ONLINE DELIVERY':
        return 'Have your order delivered to you';
      case 'TABLE BOOKING':
        return 'Reserve a table for dining';
      default:
        return 'Choose this delivery option';
    }
  };

  return (
    <div className="delivery-selection-container">
      <button
        className="back-button"
        onClick={() => navigate('/')}
        aria-label="Go back to previous page"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="content-wrapper">
        <div className="header-section">
          <h1 className="main-title">Choose Your Experience</h1>
          <p className="subtitle">Select how you'd like to enjoy your order</p>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
            <p className="loading-text">Loading delivery options...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-message">
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <div className="delivery-grid">
            {deliveryTypes.map((type, index) => (
              <div key={index} className="delivery-card-wrapper">
                <button
                  className="delivery-card"
                  onClick={() => handleNavigation(type)}
                  aria-label={`Select ${type} delivery type`}
                >
                  <div className="card-icon">
                    {getDeliveryIcon(type)}
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">{type.toUpperCase()}</h3>
                    <p className="card-description">{getDeliveryDescription(type)}</p>
                  </div>
                  <div className="card-arrow">
                    <ArrowLeft size={20} />
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FirstTab;