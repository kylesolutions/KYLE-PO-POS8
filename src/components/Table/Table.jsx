import React, { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./table.css";
import UserContext from "../../Context/UserContext";
import { v4 as uuidv4 } from 'uuid';

function Table() {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { setCartItems } = useContext(UserContext);
    const [activeOrders, setActiveOrders] = useState([]);
    const navigate = useNavigate();

    const fetchActiveOrders = useCallback(async () => {
        try {
            const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_saved_orders", {
                method: "GET",
                headers: {
                    "Authorization": "token 0bde704e8493354:5709b3ab1a1cb1a",
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error(`Failed to fetch saved orders: ${response.status}`);
            const data = await response.json();
            console.log("Fetched Saved Orders Response:", JSON.stringify(data, null, 2));
            if (data.message && Array.isArray(data.message.data)) {
                const activeTableNumbers = data.message.data
                    .map(order => order.table_number)
                    .filter(Boolean);
                console.log("Active Table Numbers:", activeTableNumbers);
                setActiveOrders(activeTableNumbers);
            } else {
                console.warn("No valid saved orders data found.");
                setActiveOrders([]);
            }
        } catch (error) {
            console.error("Error fetching active orders:", error);
            setActiveOrders([]);
        }
    }, []);

    useEffect(() => {
        const fetchTables = async () => {
            try {
                const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_table_details", {
                    headers: { "Authorization": "token 0bde704e8493354:5709b3ab1a1cb1a" }
                });
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const data = await response.json();
                console.log("Fetched Tables:", data);
                setTables(data.message || []);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchTables();
        fetchActiveOrders(); // Re-fetch every time component mounts
    }, [fetchActiveOrders]); // Remove empty array to ensure re-fetch on navigation

    const handleTableClick = async (tableNumber) => {
      try {
          const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_saved_orders", {
              method: "GET",
              headers: {
                  "Authorization": "token 0bde704e8493354:5709b3ab1a1cb1a",
                  "Content-Type": "application/json",
              },
          });
          if (!response.ok) throw new Error(`Failed to fetch saved orders: ${response.status}`);
          const data = await response.json();
          console.log("Saved Orders for Table", tableNumber, ":", JSON.stringify(data, null, 2));
          const existingOrder = data.message.data.find(order => order.table_number === tableNumber);
  
          if (existingOrder) {
              const formattedCartItems = existingOrder.items.map(item => ({
                  item_code: item.item,
                  name: item.item,
                  basePrice: item.price,
                  quantity: item.quantity,
                  selectedSize: item.size_variants || "",
                  selectedCustomVariant: item.other_variants || "",
                  kitchen: item.kitchen || "Unknown",
                  cartItemId: uuidv4(), // Unique key for cart
                  addonCounts: existingOrder.saved_addons.reduce((acc, addon) => ({
                      ...acc,
                      [addon.addon_name]: {
                          price: 0, // Adjust if price is available in backend
                          quantity: addon.addon_quantity,
                          kitchen: addon.addons_kitchen || "Unknown",
                      },
                  }), {}),
                  selectedCombos: existingOrder.saved_combos.map(combo => ({
                      name1: combo.combo_name,
                      item_code: combo.combo_name,
                      rate: 0, // Adjust if rate is available in backend
                      quantity: combo.quantity,
                      selectedSize: combo.size_variants || "",
                      selectedCustomVariant: combo.other_variants || "",
                      kitchen: combo.combo_kitchen || "Unknown",
                  })),
              }));
              setCartItems(formattedCartItems);
              const navigationState = {
                  tableNumber,
                  customerName: existingOrder.customer_name,
                  phoneNumber: existingOrder.phone_number,
                  existingOrder: {
                      name: existingOrder.name,
                      customerName: existingOrder.customer_name,
                      phoneNumber: existingOrder.phone_number,
                      tableNumber: existingOrder.table_number,
                      deliveryType: existingOrder.delivery_type,
                      cartItems: formattedCartItems,
                  },
              };
              console.log("Navigating to /frontpage with state:", JSON.stringify(navigationState, null, 2));
              navigate("/frontpage", { state: navigationState });
          } else {
              setCartItems([]);
              console.log("No existing order for Table", tableNumber, "- Navigating with tableNumber only");
              navigate("/frontpage", { state: { tableNumber } });
          }
      } catch (error) {
          console.error("Error fetching order for table:", error);
          setCartItems([]);
          navigate("/frontpage", { state: { tableNumber } });
      }
  };

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