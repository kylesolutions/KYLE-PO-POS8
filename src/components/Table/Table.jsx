import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./table.css";
import UserContext from "../../Context/UserContext";

function Table() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setCartItems } = useContext(UserContext);
  const [bookedTables, setBookedTables] = useState(() => {
    const saved = localStorage.getItem("bookedTables");
    return saved ? JSON.parse(saved) : [];
  });

  const navigate = useNavigate();

  const handleTableClick = (tableNumber) => {
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    const existingOrder = savedOrders.find(
      (order) => order.tableNumber === tableNumber
    );
    if (existingOrder) {
      setCartItems(existingOrder.cartItems);
    } else {
      setCartItems([]);
    }
    alert(`You selected Table ${tableNumber}`);
    navigate("/frontpage", { state: { tableNumber, existingOrder } });
  };


  // const resetTableStatus = (tableNumber) => {
  //   const updatedBookedTables = bookedTables.filter(
  //     (bookedTable) => bookedTable !== tableNumber
  //   );
  //   setBookedTables(updatedBookedTables);
  //   localStorage.setItem("bookedTables", JSON.stringify(updatedBookedTables));

  //   alert(`Table ${tableNumber} is now available.`);
  // };

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch(
          "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_table_details"
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        if (data.message) {
          setTables(data.message);
        } else {
          setTables([]);
        }
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
    <div className="table-page container">
      <h1>Restaurant Table Layout</h1>
      <div className="table-grid row">
        {tables.length > 0 ? (
          tables.map((table, index) => (
            <div
              key={index}
              className={`table-card ${bookedTables.includes(table.table_number) ? "booked" : "available"
                }`}
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

  );
}

export default Table;
