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
    const [allItems, setAllItems] = useState([]);
    const navigate = useNavigate();

    // Fetch all items (consistent with SavedOrder.jsx)
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

    // Fetch active POS Invoices (replacing get_saved_orders)
    const fetchActiveOrders = useCallback(async () => {
        try {
            const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoices", {
                method: "GET",
                headers: {
                    Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error(`Failed to fetch POS Invoices: ${response.status}`);
            const data = await response.json();
            console.log("Fetched POS Invoices Response:", JSON.stringify(data, null, 2));

            const result = data.message || data;
            if (result.status !== "success") throw new Error(result.message || "Unknown error");

            if (!result.data || !Array.isArray(result.data)) {
                console.warn("No valid POS Invoices data found.");
                setActiveOrders([]);
                return;
            }

            // Filter for draft invoices without payments
            const draftOrders = result.data.filter(order => 
                order.custom_is_draft_without_payment === 1 || order.custom_is_draft_without_payment === "1"
            );
            const activeTableNumbers = draftOrders
                .map(order => String(order.custom_table_number))
                .filter(Boolean); // Only include non-empty table numbers
            console.log("Active Table Numbers from POS Invoices:", activeTableNumbers);
            setActiveOrders(activeTableNumbers);
        } catch (error) {
            console.error("Error fetching POS Invoices:", error);
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
            const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoices", {
                method: "GET",
                headers: {
                    Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error(`Failed to fetch POS Invoices: ${response.status}`);
            const data = await response.json();
            console.log("POS Invoices for Table", tableNumber, ":", JSON.stringify(data, null, 2));

            const result = data.message || data;
            if (result.status !== "success" || !result.data) throw new Error(result.message || "Invalid response");

            const existingOrder = result.data.find(order => 
                String(order.custom_table_number) === String(tableNumber) && 
                (order.custom_is_draft_without_payment === 1 || order.custom_is_draft_without_payment === "1")
            );

            if (existingOrder) {
                const formattedCartItems = existingOrder.items.map(item => {
                    const menuItem = allItems.find(m => m.item_code === item.item_code) || {};
                    return {
                        cartItemId: uuidv4(),
                        item_code: item.item_code,
                        name: item.item_name,
                        basePrice: parseFloat(item.rate) || 0,
                        quantity: parseInt(item.qty, 10) || 1,
                        selectedSize: item.custom_size_variants || null,
                        selectedCustomVariant: item.custom_other_variants || null,
                        kitchen: menuItem.custom_kitchen || item.custom_kitchen || "Unknown",
                        addonCounts: {}, // Addons not in POS Invoice yet; adjust if backend updates
                        selectedCombos: [], // Combos not in POS Invoice yet; adjust if backend updates
                    };
                });

                console.log("Formatted Cart Items:", JSON.stringify(formattedCartItems, null, 2));
                setCartItems(formattedCartItems);

                const navigationState = {
                    tableNumber,
                    phoneNumber: existingOrder.contact_mobile,
                    customerName: existingOrder.customer,
                    existingOrder: {
                        name: existingOrder.name,
                        customer: existingOrder.customer,
                        contact_mobile: existingOrder.contact_mobile,
                        custom_table_number: existingOrder.custom_table_number,
                        custom_delivery_type: existingOrder.custom_delivery_type,
                        customer_address: existingOrder.customer_address,
                        contact_email: existingOrder.contact_email,
                        posting_date: existingOrder.posting_date,
                        cartItems: formattedCartItems,
                        // Add discount fields
                        apply_discount_on: existingOrder.apply_discount_on || "Grand Total",
                        additional_discount_percentage: parseFloat(existingOrder.additional_discount_percentage) || 0,
                        discount_amount: parseFloat(existingOrder.discount_amount) || 0,
                    },
                    deliveryType: existingOrder.custom_delivery_type,
                };
                console.log("Navigating to /frontpage with state:", JSON.stringify(navigationState, null, 2));
                navigate("/frontpage", { state: navigationState });
            } else {
                setCartItems([]);
                console.log("No existing POS Invoice for Table", tableNumber, "- Navigating with tableNumber only");
                navigate("/frontpage", { state: { tableNumber, deliveryType: "DINE IN" } });
            }
        } catch (error) {
            console.error("Error fetching POS Invoice for table:", error);
            setCartItems([]);
            navigate("/frontpage", { state: { tableNumber, deliveryType: "DINE IN" } });
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