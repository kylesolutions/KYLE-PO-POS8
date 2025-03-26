import { useContext, useEffect, useState } from "react";
import UserContext from "../../Context/UserContext";
import { useNavigate } from "react-router-dom";

function SavedOrder() {
    const { setCartItems } = useContext(UserContext);
    const [orders, setOrders] = useState([]);
    const navigate = useNavigate();

    const fetchSavedOrders = async () => {
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
            console.log("Raw Server Response:", JSON.stringify(data, null, 2)); // Detailed log

            const result = data.message || data;
            if (result.status !== "success") throw new Error(result.message || "Unknown error");

            if (!result.data || !Array.isArray(result.data)) {
                console.warn("No orders found or invalid data structure:", result);
                setOrders([]);
                return;
            }

            const formattedOrders = result.data.map(order => {
                console.log("Processing order:", order); // Log each order
                return {
                    name: order.name,
                    customerName: order.customer_name,
                    tableNumber: order.table_number,
                    phoneNumber: order.phone_number,
                    timestamp: order.time,
                    deliveryType: order.delivery_type,
                    cartItems: order.items.map(item => ({
                        item_code: item.item,
                        name: item.item,
                        basePrice: item.price,
                        quantity: item.quantity,
                        selectedSize: item.size_variants,
                        selectedCustomVariant: item.other_variants,
                        kitchen: item.kitchen,
                        addonCounts: order.saved_addons.reduce((acc, addon) => ({
                            ...acc,
                            [addon.addon_name]: {
                                price: 0, // Adjust if price is available
                                quantity: addon.addon_quantity,
                                kitchen: addon.addons_kitchen,
                            },
                        }), {}),
                        selectedCombos: order.saved_combos.map(combo => ({
                            name1: combo.combo_name,
                            item_code: combo.combo_name,
                            rate: 0, // Adjust if rate is available
                            quantity: combo.quantity,
                            selectedSize: combo.size_variants,
                            selectedCustomVariant: combo.other_variants,
                            kitchen: combo.combo_kitchen,
                        })),
                    })),
                };
            });

            console.log("Formatted orders:", formattedOrders);
            setOrders(formattedOrders);
        } catch (error) {
            console.error("Error fetching saved orders:", error.message);
            setOrders([]); // Ensure blank state on error
        }
    };

    useEffect(() => {
        fetchSavedOrders();
    }, []);

    const handleDeleteOrder = async (orderName) => {
        const confirmed = window.confirm("Are you sure you want to delete this order?");
        if (confirmed) {
            try {
                const response = await fetch(`/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.delete_saved_order?doc_name=${orderName}`, {
                    method: "GET",
                    headers: {
                        "Authorization": "token 0bde704e8493354:5709b3ab1a1cb1a",
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
            item_code: item.item_code || item.id,
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
                item_code: combo.item_code,
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
                                                    - Qty: {item.quantity}
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
                                                                - ${(combo.rate || 0) * (combo.quantity || 1).toFixed(2)}
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