import { useContext, useEffect, useState } from "react";
import UserContext from "../../Context/UserContext";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

function SavedOrder({ orders, setSavedOrders, menuItems }) {
    const { setCartItems } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchSavedOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                "http://109.199.100.136:6060/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoices",
                {
                    method: "GET",
                    headers: {
                        Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                        "Content-Type": "application/json",
                        "Expect": "",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch POS Invoices: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Raw response from get_pos_invoices:", data);

            const result = data.message || data;
            if (result.status !== "success") {
                throw new Error(result.message || "Unknown error from server");
            }

            if (!result.data || !Array.isArray(result.data)) {
                console.warn("No data or invalid format in response:", result);
                setSavedOrders([]);
                return;
            }

            const draftOrders = result.data.filter(
                (order) =>
                    order.custom_is_draft_without_payment === 1 ||
                    order.custom_is_draft_without_payment === "1"
            );
            console.log("Filtered draft orders:", draftOrders);

            const formattedOrders = draftOrders.map((order) => {
                const cartItems = order.items.map((item) => {
                    const menuItem = menuItems.find((m) => m.item_code === item.item_code) || {};
                    return {
                        cartItemId: uuidv4(),
                        item_code: item.item_code,
                        name: item.item_name,
                        description: item.custom_customer_description || "",
                        basePrice: parseFloat(item.rate) || 0,
                        quantity: parseInt(item.qty, 10) || 1,
                        selectedSize: item.custom_size_variants || null,
                        selectedCustomVariant: item.custom_other_variants || null,
                        kitchen: menuItem.custom_kitchen || item.custom_kitchen || "Unknown",
                        addonCounts: {},
                        selectedCombos: [],
                    };
                });

                // Parse custom_chair_numbers into an array of integers
                const chairNumbers = order.custom_chair_numbers
                    ? Array.isArray(order.custom_chair_numbers)
                        ? order.custom_chair_numbers.map(num => parseInt(num))
                        : order.custom_chair_numbers.split(",").map(num => parseInt(num.trim()))
                    : [];

                return {
                    name: order.name,
                    customer: order.customer_name,
                    custom_table_number: order.custom_table_number,
                    contact_mobile: order.contact_mobile,
                    custom_delivery_type: order.custom_delivery_type || "DINE IN",
                    custom_chair_count: parseInt(order.custom_chair_count) || 0,
                    custom_chair_numbers: chairNumbers, // Add chair numbers
                    customer_address: order.customer_address || "",
                    contact_email: order.contact_email || "",
                    posting_date: order.posting_date,
                    posting_time: order.posting_time,
                    cartItems,
                    apply_discount_on: order.apply_discount_on || "Grand Total",
                    additional_discount_percentage: parseFloat(order.additional_discount_percentage) || 0,
                    discount_amount: parseFloat(order.discount_amount) || 0,
                };
            });

            setSavedOrders(formattedOrders);
            console.log("Formatted orders set:", formattedOrders);
        } catch (error) {
            console.error("Error fetching POS Invoices:", error.message);
            setError(`Failed to load saved orders: ${error.message}. Please try again or contact support.`);
            setSavedOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedOrders();
    }, [setSavedOrders, menuItems]);

    const handleSelectOrder = (order) => {
        const formattedCartItems = order.cartItems.map((item) => ({
            cartItemId: item.cartItemId || uuidv4(),
            id: item.item_code,
            item_code: item.item_code,
            name: item.name,
            custom_customer_description: item.description || "",
            basePrice: item.basePrice || 0,
            quantity: item.quantity || 1,
            selectedSize: item.selectedSize || null,
            selectedCustomVariant: item.selectedCustomVariant || null,
            addonCounts: item.addonCounts || {},
            selectedCombos: item.selectedCombos || [],
            kitchen: item.kitchen || "Unknown",
        }));

        console.log("Formatted cart items for Front:", formattedCartItems);
        setCartItems(formattedCartItems);

        alert(
            `You selected ${
                order.custom_delivery_type === "DINE IN"
                    ? `Table ${order.custom_table_number}${order.custom_chair_count > 0 ? ` (Chairs: ${order.custom_chair_count})` : ""}`
                    : `Order (${order.custom_delivery_type})`
            }`
        );

        navigate("/frontpage", {
            state: {
                tableNumber: order.custom_table_number,
                phoneNumber: order.contact_mobile,
                customerName: order.customer,
                chairCount: order.custom_chair_count,
                chairNumbers: order.custom_chair_numbers, // Pass chair numbers
                existingOrder: {
                    ...order,
                    items: order.cartItems.map((item) => ({
                        item_code: item.item_code,
                        item_name: item.name,
                        custom_customer_description: item.description || "",
                        rate: item.basePrice || 0,
                        qty: item.quantity || 1,
                        custom_size_variants: item.selectedSize || "",
                        custom_other_variants: item.selectedCustomVariant || "",
                        custom_kitchen: item.kitchen || "Unknown",
                    })),
                    apply_discount_on: order.apply_discount_on,
                    additional_discount_percentage: order.additional_discount_percentage,
                    discount_amount: order.discount_amount,
                    custom_chair_count: order.custom_chair_count,
                    custom_chair_numbers: order.custom_chair_numbers, // Include in existingOrder
                },
                deliveryType: order.custom_delivery_type,
                address: order.customer_address,
                email: order.contact_email,
            },
        });
    };

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">Saved Orders</h2>
            {loading ? (
                <p className="text-center text-muted">Loading saved orders...</p>
            ) : error ? (
                <p className="text-center text-danger">{error}</p>
            ) : orders.length === 0 ? (
                <p className="text-center text-muted">No draft invoices without payments found.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                        <thead className="table-dark">
                            <tr>
                                <th>#</th>
                                <th>Customer Name</th>
                                <th>Table Number</th>
                                <th>Chair Count</th>
                                <th>Phone Number</th>
                                <th>Delivery Type</th>
                                <th>Address</th>
                                <th>Email</th>
                                <th>Items</th>
                                <th>Timestamp</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order, index) => (
                                <tr key={order.name}>
                                    <td>{index + 1}</td>
                                    <td>{order.customer}</td>
                                    <td>{order.custom_table_number || "N/A"}</td>
                                    <td>{order.custom_delivery_type === "DINE IN" ? order.custom_chair_count : "N/A"}</td>
                                    <td>{order.contact_mobile || "N/A"}</td>
                                    <td>{order.custom_delivery_type}</td>
                                    <td>{order.customer_address || "N/A"}</td>
                                    <td>{order.contact_email || "N/A"}</td>
                                    <td>
                                        {order.cartItems.map((item, i) => (
                                            <div key={i} className="mb-2">
                                                <div>
                                                    <strong>{item.name}</strong>
                                                    {item.selectedSize && ` (${item.selectedSize})`}
                                                    {item.selectedCustomVariant &&
                                                        ` (${item.selectedCustomVariant})`}
                                                    - Qty: {item.quantity} - AED 
                                                    {(item.basePrice * item.quantity).toFixed(2)}
                                                </div>
                                                {item.description && (
                                                    <p
                                                        style={{
                                                            fontSize: "12px",
                                                            color: "#666",
                                                            marginTop: "5px",
                                                            marginBottom: "0",
                                                        }}
                                                    >
                                                        <strong>Note:</strong> {item.description}
                                                    </p>
                                                )}
                                                {item.addonCounts &&
                                                    Object.keys(item.addonCounts).length > 0 && (
                                                        <ul
                                                            style={{
                                                                listStyleType: "none",
                                                                padding: 0,
                                                                marginTop: "5px",
                                                                fontSize: "12px",
                                                                color: "#888",
                                                            }}
                                                        >
                                                            {Object.entries(item.addonCounts).map(
                                                                ([addonName, { price, quantity }]) => (
                                                                    <li key={addonName}>
                                                                        + {addonName} x{quantity} (AED 
                                                                        {(price * quantity).toFixed(2)})
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    )}
                                            </div>
                                        ))}
                                    </td>
                                    <td>{order.posting_date} {order.posting_time}</td>
                                    <td className="d-flex">
                                        <button
                                            className="btn btn-primary btn-sm me-2"
                                            onClick={() => handleSelectOrder(order)}
                                        >
                                            Select
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