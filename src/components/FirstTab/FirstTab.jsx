import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './FirstTab.css';

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

  return (
    <div className="container-fluid main">
      <button
        className="back-button"
        onClick={() => navigate('/')}
        aria-label="Go back to previous page"
        title="Back"
      >
        <i className="bi bi-arrow-left-circle"></i>
      </button>
      <div className="row justify-content-center align-items-center">
        <div className="col-12 text-center mb-4">
          <h1 className="display-5 fw-bold">Select Delivery Type</h1>
          <p className="text-muted">Choose how you'd like to place your order</p>
        </div>
        {isLoading ? (
          <div className="col-12 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="col-12 text-center">
            <div className="alert alert-warning" role="alert">
              {error}
            </div>
          </div>
        ) : (
          <div className="row g-3 justify-content-center">
            {deliveryTypes.map((type, index) => (
              <div key={index} className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center">
                <button
                  className="main-button"
                  onClick={() => handleNavigation(type)}
                  aria-label={`Select ${type} delivery type`}
                  title={`Choose ${type}`}
                >
                  {type.toUpperCase()}
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