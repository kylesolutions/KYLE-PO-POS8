import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./table.css";
import UserContext from "../../Context/UserContext";

function Table() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setCartItems } = useContext(UserContext);
  const [activeOrders, setActiveOrders] = useState([]);

  const navigate = useNavigate();

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

    const fetchActiveOrders = async () => {
      try {
        const response = await fetch("/api/resource/Saved Orders", {
          method: "GET",
          headers: {
            "Authorization": "token 0bde704e8493354:5709b3ab1a1cb1a",
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch saved orders");
        const data = await response.json();
        const activeTableNumbers = data.data.map(order => order.table_number);
        setActiveOrders(activeTableNumbers);
      } catch (error) {
        console.error("Error fetching active orders:", error);
      }
    };

    fetchTables();
    fetchActiveOrders();
  }, []);

  const handleTableClick = async (tableNumber) => {
    try {
      const response = await fetch("/api/resource/Saved Orders", {
        method: "GET",
        headers: {
          "Authorization": "token 0bde704e8493354:5709b3ab1a1cb1a",
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch saved orders");
      const data = await response.json();
      const existingOrder = data.data.find(order => order.table_number === tableNumber);

      if (existingOrder) {
        const formattedCartItems = existingOrder.items.map(item => ({
          item_code: item.item,
          name: item.item,
          basePrice: item.price,
          quantity: item.quantity,
          selectedSize: item.size_variants,
          selectedCustomVariant: item.other_variants,
          kitchen: item.kitchen,
          addonCounts: existingOrder.saved_addons
            .filter(addon => addon.parent === existingOrder.name && addon.parentfield === "saved_addons")
            .reduce((acc, addon) => ({
              ...acc,
              [addon.addon_name]: {
                price: 0,
                quantity: addon.addon_quantity,
                kitchen: addon.addons_kitchen,
              },
            }), {}),
          selectedCombos: existingOrder.saved_combos
            .filter(combo => combo.parent === existingOrder.name && combo.parentfield === "saved_combos")
            .map(combo => ({
              name1: combo.combo_name,
              item_code: combo.combo_name,
              rate: 0,
              quantity: combo.quantity,
              selectedSize: combo.size_variants,
              selectedCustomVariant: combo.other_variants,
              kitchen: combo.combo_kitchen,
            })),
        }));
        setCartItems(formattedCartItems);
      } else {
        setCartItems([]);
      }
      setActiveOrders(prevOrders => [...new Set([...prevOrders, tableNumber])]);
      alert(`You selected Table ${tableNumber}`);
      navigate("/frontpage", { state: { tableNumber, existingOrder } });
    } catch (error) {
      console.error("Error fetching order for table:", error);
      setCartItems([]);
      navigate("/frontpage", { state: { tableNumber } });
    }
  };

  const handleOrderCompletion = async (tableNumber) => {
    try {
      const response = await fetch("/api/resource/Saved Orders", {
        method: "GET",
        headers: {
          "Authorization": "token 0bde704e8493354:5709b3ab1a1cb1a",
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch saved orders");
      const data = await response.json();
      const orderToDelete = data.data.find(order => order.table_number === tableNumber);
      if (orderToDelete) {
        await fetch(`/api/resource/Saved Orders/${orderToDelete.name}`, {
          method: "DELETE",
          headers: {
            "Authorization": "token 0bde704e8493354:5709b3ab1a1cb1a",
            "Content-Type": "application/json",
          },
        });
      }
      setActiveOrders(prevOrders => prevOrders.filter(order => order !== tableNumber));
    } catch (error) {
      console.error("Error completing order:", error);
    }
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