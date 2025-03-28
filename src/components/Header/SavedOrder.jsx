import { useContext, useEffect, useState } from "react";
import UserContext from "../../Context/UserContext";
import { useNavigate } from "react-router-dom";

function SavedOrder() {  // Removed menuItems prop since we'll fetch allItems
    const { setCartItems } = useContext(UserContext);
    const [orders, setOrders] = useState([]);
    const [allItems, setAllItems] = useState([]);  // Add state for allItems
    const navigate = useNavigate();

    // Fetch all items (same as FoodDetails.jsx)
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
                        item_code: v.item_code || `${item.item_code}-${v.type_of_variants}`,  // Ensure variant item_code is present
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

    const fetchSavedOrders = async () => {
        try {
            const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_saved_orders", {
                method: "GET",
                headers: {
                    Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error(`Failed to fetch saved orders: ${response.status}`);

            const data = await response.json();
            console.log("Raw Server Response:", JSON.stringify(data, null, 2));

            const result = data.message || data;
            if (result.status !== "success") throw new Error(result.message || "Unknown error");

            if (!result.data || !Array.isArray(result.data)) {
                console.warn("No orders found or invalid data structure:", result);
                setOrders([]);
                return;
            }

            const formattedOrders = result.data.map(order => {
                let addonIndex = 0;
                let comboIndex = 0;

                const cartItems = order.items.map(item => {
                    const menuItem = allItems.find(m => m.item_code === item.item) || {};
                    const expectedAddons = menuItem.addons?.length || 0;
                    const expectedCombos = menuItem.combos?.length || 0;

                    const itemAddons = [];
                    for (let i = 0; i < expectedAddons && addonIndex < order.saved_addons.length; i++) {
                        itemAddons.push(order.saved_addons[addonIndex]);
                        addonIndex++;
                    }

                    const itemCombos = [];
                    for (let i = 0; i < expectedCombos && comboIndex < order.saved_combos.length; i++) {
                        const combo = order.saved_combos[comboIndex];
                        const comboItem = allItems.find(m => m.item_name === combo.combo_name || m.item_code === combo.combo_item_code) || {};
                        // Prioritize combo_item_code from backend, fallback to variant resolution
                        const resolvedComboItemCode = combo.combo_item_code || (comboItem.has_variants && combo.size_variants
                            ? (allItems.find(i => i.item_code === `${comboItem.item_code}-${combo.size_variants}`)?.item_code || combo.combo_name)
                            : combo.combo_name);
                        itemCombos.push({
                            name1: combo.combo_name,
                            item_code: resolvedComboItemCode,
                            rate: parseFloat(combo.combo_rate) || 0,
                            quantity: combo.quantity || 1,
                            selectedSize: combo.size_variants || null,
                            selectedCustomVariant: combo.other_variants || null,
                            kitchen: combo.combo_kitchen || comboItem.custom_kitchen || "Unknown",
                        });
                        comboIndex++;
                    }

                    return {
                        item_code: item.item,
                        name: menuItem.item_name || item.item,
                        basePrice: parseFloat(item.price) || 0,
                        quantity: item.quantity || 1,
                        selectedSize: item.size_variants || null,
                        selectedCustomVariant: item.other_variants || null,
                        kitchen: item.kitchen || menuItem.custom_kitchen || "Unknown",
                        addonCounts: itemAddons.reduce((acc, addon) => ({
                            ...acc,
                            [addon.addon_name]: {
                                price: parseFloat(addon.addons_price) || 0,
                                quantity: addon.addon_quantity || 0,
                                kitchen: addon.addons_kitchen || "Unknown",
                            },
                        }), {}),
                        selectedCombos: itemCombos,
                    };
                });

                if (addonIndex < order.saved_addons.length || comboIndex < order.saved_combos.length) {
                    const lastItem = cartItems[cartItems.length - 1];
                    lastItem.addonCounts = {
                        ...lastItem.addonCounts,
                        ...order.saved_addons.slice(addonIndex).reduce((acc, addon) => ({
                            ...acc,
                            [addon.addon_name]: {
                                price: parseFloat(addon.addons_price) || 0,
                                quantity: addon.addon_quantity || 0,
                                kitchen: addon.addons_kitchen || "Unknown",
                            },
                        }), {}),
                    };
                    lastItem.selectedCombos = [
                        ...lastItem.selectedCombos,
                        ...order.saved_combos.slice(comboIndex).map(combo => {
                            const comboItem = allItems.find(m => m.item_name === combo.combo_name || m.item_code === combo.combo_item_code) || {};
                            const resolvedComboItemCode = combo.combo_item_code || (comboItem.has_variants && combo.size_variants
                                ? (allItems.find(i => i.item_code === `${comboItem.item_code}-${combo.size_variants}`)?.item_code || combo.combo_name)
                                : combo.combo_name);
                            return {
                                name1: combo.combo_name,
                                item_code: resolvedComboItemCode,
                                rate: parseFloat(combo.combo_rate) || 0,
                                quantity: combo.quantity || 1,
                                selectedSize: combo.size_variants || null,
                                selectedCustomVariant: combo.other_variants || null,
                                kitchen: combo.combo_kitchen || comboItem.custom_kitchen || "Unknown",
                            };
                        }),
                    ];
                }

                return {
                    name: order.name,
                    customerName: order.customer_name,
                    tableNumber: order.table_number,
                    phoneNumber: order.phone_number,
                    timestamp: order.time,
                    deliveryType: order.delivery_type,
                    cartItems,
                };
            });

            console.log("Formatted orders:", JSON.stringify(formattedOrders, null, 2));
            setOrders(formattedOrders);
        } catch (error) {
            console.error("Error fetching saved orders:", error.message);
            setOrders([]);
        }
    };

    useEffect(() => {
        fetchAllItems();  // Fetch items first
    }, []);

    useEffect(() => {
        if (allItems.length > 0) {
            fetchSavedOrders();  // Fetch orders once items are loaded
        }
    }, [allItems]);

    const handleDeleteOrder = async (orderName) => {
        const confirmed = window.confirm("Are you sure you want to delete this order?");
        if (confirmed) {
            try {
                const response = await fetch(`/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.delete_saved_order?doc_name=${orderName}`, {
                    method: "GET",
                    headers: {
                        Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                        "Content-Type": "application/json",
                    },
                });
                if (!response.ok) throw new Error(`Failed to delete order: ${response.status}`);
                const result = await response.json();
                console.log("Delete Response:", result);
                const responseData = result.message || result;
                if (responseData.status !== "success") throw new Error(responseData.message || "Unknown error");
                setOrders(prev => prev.filter(order => order.name !== orderName));
                setCartItems([]);
                alert("Order deleted successfully.");
            } catch (error) {
                console.error("Error deleting order:", error.message);
                alert("Failed to delete order: " + error.message);
            }
        }
    };

    const handleSelectOrder = (order) => {
        const formattedCartItems = order.cartItems.map(item => ({
            ...item,
            item_code: item.item_code,
            name: item.name,
            basePrice: item.basePrice || 0,
            customVariantPrice: item.customVariantPrice || 0,
            quantity: item.quantity || 1,
            selectedSize: item.selectedSize || null,
            selectedCustomVariant: item.selectedCustomVariant || null,
            addonCounts: item.addonCounts || {},
            selectedCombos: (item.selectedCombos || []).map(combo => ({
                ...combo,
                name1: combo.name1,
                item_code: combo.item_code, // Already resolved in fetchSavedOrders
                rate: combo.rate || 0,
                quantity: combo.quantity || 1,
                selectedSize: combo.selectedSize || null,
                selectedCustomVariant: combo.selectedCustomVariant || null,
                kitchen: combo.kitchen || "Unknown",
            })),
            kitchen: item.kitchen || "Unknown",
        }));
        setCartItems(formattedCartItems);
        alert(`You selected Table ${order.tableNumber}`);
        navigate("/frontpage", {
            state: {
                tableNumber: order.tableNumber,
                phoneNumber: order.phoneNumber,
                customerName: order.customerName,
                existingOrder: order,
                deliveryType: order.deliveryType || "DINE IN",
            },
        });
    };

    return (
        <div className="container mt-4">
            <h2 className="text-center">Saved Orders</h2>
            {orders.length === 0 ? (
                <p className="text-center text-muted">No saved orders yet.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Customer Name</th>
                                <th>Table Number</th>
                                <th>Phone Number</th>
                                <th>Items</th>
                                <th>Timestamp</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order, index) => (
                                <tr key={order.name}>
                                    <td>{index + 1}</td>
                                    <td>{order.customerName}</td>
                                    <td>{order.tableNumber}</td>
                                    <td>{order.phoneNumber}</td>
                                    <td>
                                        {order.cartItems.map((item, i) => (
                                            <div key={i}>
                                                <div>
                                                    {item.name}
                                                    {item.selectedSize && ` (${item.selectedSize})`}
                                                    {item.selectedCustomVariant && ` (${item.selectedCustomVariant})`}
                                                    - Qty: {item.quantity} - ${(item.basePrice * item.quantity).toFixed(2)}
                                                </div>
                                                {item.addonCounts && Object.keys(item.addonCounts).length > 0 && (
                                                    <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#888" }}>
                                                        {Object.entries(item.addonCounts).map(([addonName, { price, quantity }]) => (
                                                            <li key={addonName}>
                                                                + {addonName} x{quantity} (${(price * quantity).toFixed(2)})
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                                {item.selectedCombos && item.selectedCombos.length > 0 && (
                                                    <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#555" }}>
                                                        {item.selectedCombos.map((combo, idx) => (
                                                            <li key={idx}>
                                                                + {combo.name1} x{combo.quantity || 1}
                                                                {(combo.selectedSize || combo.selectedCustomVariant) && (
                                                                    ` (${[combo.selectedSize, combo.selectedCustomVariant].filter(Boolean).join(' - ')})`
                                                                )}
                                                                - ${(combo.rate * (combo.quantity || 1)).toFixed(2)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </td>
                                    <td>{new Date(order.timestamp).toLocaleString()}</td>
                                    <td>
                                        <button
                                            className="btn btn-primary btn-sm me-2"
                                            onClick={() => handleSelectOrder(order)}
                                        >
                                            Select
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDeleteOrder(order.name)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default SavedOrder;