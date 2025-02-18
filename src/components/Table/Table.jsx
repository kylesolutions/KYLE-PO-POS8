import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./table.css";
import UserContext from "../../Context/UserContext";

function Table() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setCartItems } = useContext(UserContext);
  const [activeOrders, setActiveOrders] = useState(() => {
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    return savedOrders.map(order => order.tableNumber); // Track tables with active orders
  });

  const navigate = useNavigate();

  // Handle Table Selection
  const handleTableClick = (tableNumber) => {
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    const existingOrder = savedOrders.find(order => order.tableNumber === tableNumber);

    if (existingOrder) {
      setCartItems(existingOrder.cartItems);
    } else {
      setCartItems([]);
    }

    // Mark the table as active (darker color)
    setActiveOrders(prevOrders => [...new Set([...prevOrders, tableNumber])]);

    alert(`You selected Table ${tableNumber}`);
    navigate("/frontpage", { state: { tableNumber, existingOrder } });
  };

  // Handle Order Completion (Reset Color)
  const handleOrderCompletion = (tableNumber) => {
    setActiveOrders(prevOrders => prevOrders.filter(order => order !== tableNumber));
  };

  // Fetch Tables from API
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch(
          "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_table_details"
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setTables(data.message || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  if (loading) return <div>Loading tables...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <i className="fi fi-rs-angle-small-left back-button" onClick={() => navigate('/firsttab')}></i>
      <div className="table-page container">
        <h1>Restaurant Table Layout</h1>
        <div className="table-grid row">
          {tables.length > 0 ? (
            tables.map((table, index) => (
              <div
                key={index}
                className={`table-card ${activeOrders.includes(table.table_number) ? "booked" : "available"}`}
                onClick={() => handleTableClick(table.table_number)}
              >
                <h2>T{table.table_number}</h2>
              </div>
            ))
          ) : (
            <div>No tables available.</div>
          )}
        </div>
      </div>
    </>
  );
}

export default Table;
