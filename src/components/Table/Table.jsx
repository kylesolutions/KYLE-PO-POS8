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
    return savedOrders.map(order => order.tableNumber);
  });

  const navigate = useNavigate();

  const handleTableClick = (tableNumber) => {
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    const existingOrder = savedOrders.find(order => order.tableNumber === tableNumber);

    if (existingOrder) {
      const formattedCartItems = existingOrder.cartItems.map(item => ({
        ...item,
        basePrice: item.basePrice || 0,
        quantity: item.quantity || 1,
        addonCounts: item.addonCounts || {},
        selectedCombos: item.selectedCombos || [],
      }));
      setCartItems(formattedCartItems);
    } else {
      setCartItems([]);
    }
    setActiveOrders(prevOrders => [...new Set([...prevOrders, tableNumber])]);

    alert(`You selected Table ${tableNumber}`);
    navigate("/frontpage", { state: { tableNumber, existingOrder } });
  };

  const handleOrderCompletion = (tableNumber) => {
    setActiveOrders(prevOrders => prevOrders.filter(order => order !== tableNumber));
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    const updatedOrders = savedOrders.filter(order => order.tableNumber !== tableNumber);
    localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
  };

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
      <i className="fi fi-rs-angle-small-left back-button1" onClick={() => navigate('/firsttab')}></i>
      <div className="table-page container">
        <h1>Restaurant Table Layout</h1>
        <div className="table-grid">
          {tables.length > 0 ? (
            tables.map((table, index) => (
              <div
                key={index}
                className={`table-card ${activeOrders.includes(table.table_number) ? "booked" : "available"}`}
                onClick={() => handleTableClick(table.table_number)}
              >
                <h2>T{table.table_number}</h2>
                <div className="chairs-container">
                  {Array.from({ length: table.number_of_chair }).map((_, chairIndex) => (
                    <i key={chairIndex} className="fa-solid fa-chair chair-icon"></i>
                  ))}
                </div>
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