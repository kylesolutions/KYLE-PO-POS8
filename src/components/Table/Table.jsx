import React, { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./table.css";
import UserContext from "../../Context/UserContext";
import { v4 as uuidv4 } from "uuid";

function Table() {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { setCartItems } = useContext(UserContext);
    const [activeOrders, setActiveOrders] = useState([]);
    const [allItems, setAllItems] = useState([]); // Add state for all items
    const navigate = useNavigate();

    // Fetch all items (same as SavedOrder.jsx)
    const fetchAllItems = async () => {
        try {
            const response = await fetch(
                "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_kyle_item_details",
                {
                    method: "GET",
                    headers: {
                        Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                        "Content-Type": "application/json",
                    },
                }
            );
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            console.log("Raw Items API Response:", JSON.stringify(data, null, 2));

            let itemList = Array.isArray(data) ? data : (data.message && Array.isArray(data.message) ? data.message : []);
            if (!itemList.length) throw new Error("Invalid items data structure");

            const baseUrl = "http://109.199.100.136:6060/";
            setAllItems(
                itemList.map((item) => ({
                    ...item,
                    variants: item.variants ? item.variants.map((v) => ({
                        type_of_variants: v.type_of_variants,
                        item_code: v.item_code || `${item.item_code}-${v.type_of_variants}`,
                        variant_price: parseFloat(v.variants_price) || 0,
                    })) : [],
                    price_list_rate: parseFloat(item.price_list_rate) || 0,
                    image: item.image ? `${baseUrl}${item.image}` : "default-image.jpg",
                    custom_kitchen: item.custom_kitchen || "Unknown",
                    item_name: item.item_name || item.name,
                    has_variants: item.has_variants || false,
                }))
            );
        } catch (error) {
            console.error("Error fetching all items:", error);
            setAllItems([]);
        }
    };

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
                    .map(order => String(order.table_number))
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
        const fetchTablesAndOrders = async () => {
            try {
                const tableResponse = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_table_details", {
                    headers: { "Authorization": "token 0bde704e8493354:5709b3ab1a1cb1a" },
                });
                if (!tableResponse.ok) throw new Error(`HTTP error! Status: ${tableResponse.status}`);
                const tableData = await tableResponse.json();
                console.log("Fetched Tables:", JSON.stringify(tableData, null, 2));
                setTables(tableData.message || []);

                await fetchAllItems(); // Fetch items first
                await fetchActiveOrders();
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchTablesAndOrders();
    }, [fetchActiveOrders]);

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
            const existingOrder = data.message.data.find(order => String(order.table_number) === String(tableNumber));

            if (existingOrder) {
                const formattedCartItems = existingOrder.items.map(item => {
                    const menuItem = allItems.find(m => m.item_code === item.item) || {};
                    return {
                        item_code: item.item,
                        name: menuItem.item_name || item.item,
                        basePrice: parseFloat(item.price) || 0,
                        quantity: parseInt(item.quantity, 10) || 1,
                        selectedSize: item.size_variants || null,
                        selectedCustomVariant: item.other_variants || null,
                        kitchen: item.kitchen || menuItem.custom_kitchen || "Unknown",
                        cartItemId: uuidv4(),
                        addonCounts: (existingOrder.saved_addons || []).reduce((acc, addon) => ({
                            ...acc,
                            [addon.addon_name]: {
                                price: parseFloat(addon.addons_price) || 0,
                                quantity: parseInt(addon.addon_quantity, 10) || 0,
                                kitchen: addon.addons_kitchen || "Unknown",
                            },
                        }), {}),
                        selectedCombos: (existingOrder.saved_combos || []).map(combo => {
                            const comboItem = allItems.find(m => m.item_name === combo.combo_name || m.item_code === combo.combo_item_code) || {};
                            const resolvedComboItemCode = combo.combo_item_code || (comboItem.has_variants && combo.size_variants
                                ? (allItems.find(i => i.item_code === `${comboItem.item_code}-${combo.size_variants}`)?.item_code || combo.combo_name)
                                : combo.combo_name);
                            return {
                                name1: combo.combo_name,
                                item_code: resolvedComboItemCode,
                                rate: parseFloat(combo.combo_rate) || 0,
                                quantity: parseInt(combo.quantity, 10) || 1,
                                selectedSize: combo.size_variants || null,
                                selectedCustomVariant: combo.other_variants || null,
                                kitchen: combo.combo_kitchen || comboItem.custom_kitchen || "Unknown",
                            };
                        }),
                    };
                });

                console.log("Formatted Cart Items:", JSON.stringify(formattedCartItems, null, 2));
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

    console.log("Rendering tables with activeOrders:", activeOrders);

    return (
        <>
            <i className="fi fi-rs-angle-small-left back-button1" onClick={() => navigate("/firsttab")}></i>
            <div className="table-page container">
                <h1>Restaurant Table Layout</h1>
                <div className="table-grid">
                    {tables.length > 0 ? (
                        tables.map((table, index) => (
                            <div
                                key={index}
                                className={`table-card ${activeOrders.includes(String(table.table_number)) ? "booked" : "available"}`}
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