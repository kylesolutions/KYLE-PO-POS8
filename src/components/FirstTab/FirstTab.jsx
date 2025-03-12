import React, { useState, useEffect } from 'react';
import './firstTab.css';
import { useNavigate, useLocation } from 'react-router-dom';

function FirstTab() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { posOpeningEntry } = state || {};
  const [deliveryTypes, setDeliveryTypes] = useState([]);

  useEffect(() => {
    const fetchDeliveryTypes = async () => {
      try {
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
          setDeliveryTypes(["TAKE AWAY", "DINE IN", "ONLINE DELIVERY"]);
        }
      } catch (error) {
        console.error("Error fetching delivery types:", error);
        setDeliveryTypes(["TAKE AWAY", "DINE IN", "ONLINE DELIVERY"]);
      }
    };
    fetchDeliveryTypes();
  }, []);

  const handleNavigation = (type) => {
    const nextPath = type.toUpperCase() === "DINE IN" ? '/table' : '/frontpage';
    navigate(nextPath, { state: { deliveryType: type.toUpperCase(), posOpeningEntry } });
  };

  return (
    <div className="container-fluid main">
      <button className="back-button" onClick={() => navigate('/')} aria-label="Go back">
        <i className="bi bi-arrow-left-circle"></i>
      </button>
      <div className="row justify-content-center g-3">
        {deliveryTypes.map((type, index) => (
          <div key={index} className="col-12 col-md-6 col-lg-4 d-flex justify-content-center">
            <button className="main-button" onClick={() => handleNavigation(type)}>
              {type.toUpperCase()}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FirstTab;