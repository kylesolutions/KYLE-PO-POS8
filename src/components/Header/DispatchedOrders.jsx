import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import './DispatchedOrders.css';

function DispatchedOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchDispatchedOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            // Step 1: Fetch all kitchen notes
            const kitchenResponse = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_kitchen_notes', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
                },
            });

            if (!kitchenResponse.ok) {
                const responseText = await kitchenResponse.text();
                console.error('Fetch kitchen notes failed:', {
                    status: kitchenResponse.status,
                    statusText: kitchenResponse.statusText,
                    responseText,
                });
                throw new Error(`Failed to fetch kitchen notes: ${kitchenResponse.status} - ${kitchenResponse.statusText}`);
            }

            let kitchenResult;
            try {
                kitchenResult = await kitchenResponse.json();
            } catch (jsonError) {
                console.error('Error parsing kitchen notes JSON response:', jsonError);
                throw new Error('Invalid response format from server: Unable to parse JSON');
            }

            console.log('DispatchedOrders.jsx: Raw response from get_kitchen_notes:', JSON.stringify(kitchenResult, null, 2));

            if (!kitchenResult.message || kitchenResult.message.status !== 'success') {
                throw new Error(kitchenResult.message?.message || 'Failed to fetch kitchen notes: Invalid response status');
            }

            if (!Array.isArray(kitchenResult.message.data)) {
                throw new Error('Invalid response format: Expected kitchen notes data to be an array');
            }

            const allKitchenOrders = kitchenResult.message.data;

            // Step 2: Fetch POS invoices to get custom_chair_numbers
            const posResponse = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoices', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
                },
            });

            if (!posResponse.ok) {
                const responseText = await posResponse.text();
                console.error('Fetch POS invoices failed:', {
                    status: posResponse.status,
                    statusText: posResponse.statusText,
                    responseText,
                });
                throw new Error(`Failed to fetch POS invoices: ${posResponse.status} - ${posResponse.statusText}`);
            }

            let posResult;
            try {
                posResult = await posResponse.json();
            } catch (jsonError) {
                console.error('Error parsing POS invoices JSON response:', jsonError);
                throw new Error('Invalid response format from server: Unable to parse JSON');
            }

            console.log('DispatchedOrders.jsx: Raw response from get_pos_invoices:', JSON.stringify(posResult, null, 2));

            if (!posResult.message || posResult.message.status !== 'success') {
                throw new Error(posResult.message?.message || 'Failed to fetch POS invoices: Invalid response status');
            }

            if (!Array.isArray(posResult.message.data)) {
                throw new Error('Invalid response format: Expected POS invoices data to be an array');
            }

            const posInvoices = posResult.message.data;

            // Step 3: Map kitchen orders and enrich with custom_chair_numbers from POS invoices
            const dispatchedOrders = allKitchenOrders
                .map(kitchenOrder => {
                    // Skip orders with delivery_type = "DELIVERY"
                    if (kitchenOrder.delivery_type === "DELIVERY") {
                        return null;
                    }

                    const dispatchedItems = kitchenOrder.items.filter(item => item.status === 'Dispatched');
                    if (dispatchedItems.length === 0) return null;

                    const posInvoice = posInvoices.find(invoice => invoice.name === kitchenOrder.pos_invoice_id);

                    const chairNumbers = posInvoice?.custom_chair_numbers
                        ? Array.isArray(posInvoice.custom_chair_numbers)
                            ? posInvoice.custom_chair_numbers.map(num => parseInt(num))
                            : posInvoice.custom_chair_numbers.split(",").map(num => parseInt(num.trim()))
                        : [];

                    return {
                        name: kitchenOrder.pos_invoice_id,
                        customer: kitchenOrder.customer_name || "One Time Customer",
                        custom_table_number: kitchenOrder.table_number || "",
                        custom_delivery_type: kitchenOrder.delivery_type || "DINE IN",
                        custom_chair_count: parseInt(kitchenOrder.number_of_chair) || 0,
                        custom_chair_numbers: chairNumbers,
                        contact_mobile: posInvoice?.contact_mobile || "",
                        customer_address: posInvoice?.customer_address || "",
                        contact_email: posInvoice?.contact_email || "",
                        posting_date: kitchenOrder.order_time ? kitchenOrder.order_time.split(" ")[0] : "",
                        posting_time: kitchenOrder.order_time ? kitchenOrder.order_time.split(" ")[1] : "",
                        apply_discount_on: posInvoice?.apply_discount_on || "Grand Total",
                        additional_discount_percentage: parseFloat(posInvoice?.additional_discount_percentage) || 0,
                        discount_amount: parseFloat(posInvoice?.discount_amount) || 0,
                        dispatchedItems: dispatchedItems.map(item => {
                            let selectedSize = "";
                            let selectedCustomVariant = "";
                            if (item.custom_variants) {
                                const variants = item.custom_variants.split(" - ");
                                selectedSize = variants[0] || "";
                                selectedCustomVariant = variants[1] || "";
                            }

                            const posItem = posInvoice?.items?.find(i => i.item_name === item.item_name && i.custom_size_variants === selectedSize);
                            const itemCode = posItem?.item_code || item.item_name;

                            const isCombo = posInvoice?.items?.some(i => i.item_name === item.item_name && i.custom_size_variants && i.item_code !== item.item_name);

                            return {
                                item_code: itemCode,
                                name: item.item_name,
                                description: item.customer_description || "",
                                basePrice: parseFloat(item.price) || 0,
                                quantity: parseInt(item.quantity, 10) || 1,
                                selectedSize: selectedSize,
                                selectedCustomVariant: selectedCustomVariant,
                                kitchen: item.kitchen || "Unknown",
                                addonCounts: {},
                                selectedCombos: isCombo ? [{
                                    name1: item.item_name,
                                    selectedSize: selectedSize,
                                    selectedCustomVariant: selectedCustomVariant,
                                    custom_customer_description: item.customer_description || "",
                                    quantity: parseInt(item.quantity, 10) || 1,
                                    rate: parseFloat(item.price) || 0,
                                    kitchen: item.kitchen || "Unknown",
                                    ingredients: item.ingredients || [],
                                    status: item.status || "Not Dispatched"
                                }] : [],
                                ingredients: item.ingredients || [],
                            };
                        }),
                    };
                })
                .filter(order => order !== null);

            setOrders(dispatchedOrders);
            console.log("DispatchedOrders.jsx: Formatted dispatched orders:", JSON.stringify(dispatchedOrders, null, 2));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('DispatchedOrders.jsx: Error fetching dispatched orders:', error);
            setError(`Failed to load dispatched orders: ${errorMessage}. Please try again or contact support.`);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async (invoiceId) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.mark_pos_invoice_paid', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    mode_of_payment: "Cash" // Adjust as needed, could be dynamic
                }),
            });

            if (!response.ok) {
                const responseText = await response.text();
                console.error('mark_pos_invoice_paid failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    responseText,
                });
                throw new Error(`Failed to mark POS Invoice as Paid: ${response.status} - ${response.statusText}`);
            }

            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                console.error('Error parsing mark_pos_invoice_paid JSON response:', jsonError);
                throw new Error('Invalid response format from server: Unable to parse JSON');
            }

            console.log('DispatchedOrders.jsx: mark_pos_invoice_paid Response:', JSON.stringify(result, null, 2));

            if (result.message.status !== 'success') {
                throw new Error(result.message.message || 'Failed to mark POS Invoice as Paid');
            }

            alert(`POS Invoice ${invoiceId} marked as Paid successfully!`);
            // Refresh orders after marking as paid
            await fetchDispatchedOrders();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('DispatchedOrders.jsx: Error marking POS Invoice as Paid:', error);
            setError(`Failed to mark POS Invoice as Paid: ${errorMessage}`);
            alert(`Failed to mark POS Invoice as Paid: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDispatchedOrders();
        const intervalId = setInterval(fetchDispatchedOrders, 30000);
        return () => clearInterval(intervalId);
    }, []);

    const handleSelectOrder = (order) => {
        const formattedCartItems = order.dispatchedItems.map((item) => ({
            cartItemId: uuidv4(),
            id: item.item_code,
            item_code: item.item_code,
            name: item.name,
            custom_customer_description: item.description || "",
            basePrice: item.basePrice || 0,
            quantity: item.quantity || 1,
            selectedSize: item.selectedSize || "",
            selectedCustomVariant: item.selectedCustomVariant || "",
            addonCounts: item.addonCounts || {},
            selectedCombos: item.selectedCombos || [],
            kitchen: item.kitchen || "Unknown",
            ingredients: item.ingredients || [],
            status: "Dispatched"
        }));

        console.log("DispatchedOrders.jsx: Formatted cart items for Front:", JSON.stringify(formattedCartItems, null, 2));

        alert(
            `You selected ${
                order.custom_delivery_type === "DINE IN"
                    ? `Table ${order.custom_table_number}${order.custom_chair_count > 0 ? ` (Chairs: ${order.custom_chair_count})` : ""}`
                    : `Order (${order.custom_delivery_type})`
            } for billing`
        );

        navigate('/frontpage', {
            state: {
                tableNumber: order.custom_table_number || "",
                deliveryType: order.custom_delivery_type || "DINE IN",
                chairCount: order.custom_chair_count || 0,
                chairNumbers: order.custom_chair_numbers || [],
                customer: order.customer || "",
                customer_name: order.customer || "One Time Customer",
                customer_phone: order.contact_mobile || "",
                address: order.customer_address || "",
                email: order.contact_email || "",
                watsappNumber: order.contact_mobile || "",
                existingOrder: {
                    ...order,
                    items: order.dispatchedItems.map((item) => ({
                        item_code: item.item_code,
                        item_name: item.name,
                        custom_customer_description: item.description || "",
                        rate: item.basePrice || 0,
                        qty: item.quantity || 1,
                        custom_size_variants: item.selectedSize || "",
                        custom_other_variants: item.selectedCustomVariant || "",
                        custom_kitchen: item.kitchen || "Unknown",
                        ingredients: item.ingredients || [],
                        status: "Dispatched"
                    })),
                    apply_discount_on: order.apply_discount_on,
                    additional_discount_percentage: order.additional_discount_percentage,
                    discount_amount: order.discount_amount,
                    custom_chair_count: order.custom_chair_count,
                    custom_chair_numbers: order.custom_chair_numbers,
                },
                dispatchedItems: order.dispatchedItems,
            },
        });
    };

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">Dispatched Orders</h2>
            {loading ? (
                <p className="text-center text-muted">Loading dispatched orders...</p>
            ) : error ? (
                <p className="text-center text-danger">{error}</p>
            ) : orders.length === 0 ? (
                <p className="text-center text-muted">No dispatched orders found.</p>
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
                                        {order.dispatchedItems.map((item, i) => (
                                            <div key={i} className="mb-2">
                                                <div>
                                                    <strong>{item.name}</strong>
                                                    {item.selectedSize && ` (${item.selectedSize})`}
                                                    {item.selectedCustomVariant &&
                                                        ` (${item.selectedCustomVariant})`}
                                                    - Qty: {item.quantity} - ₹
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
                                                {item.ingredients?.length > 0 && (
                                                    <p
                                                        style={{
                                                            fontSize: "12px",
                                                            color: "#666",
                                                            marginTop: "5px",
                                                            marginBottom: "0",
                                                        }}
                                                    >
                                                        <strong>Ingredients:</strong>{" "}
                                                        {item.ingredients
                                                            .map(
                                                                (ing) =>
                                                                    `${ing.name} - ${ing.quantity} ${ing.unit}`
                                                            )
                                                            .join(", ")}
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
                                                                        + {addonName} x{quantity} (₹
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
                                    <td>
                                        <button
                                            className="btn btn-primary btn-sm me-2"
                                            onClick={() => handleSelectOrder(order)}
                                        >
                                            Select for Billing
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

export default DispatchedOrders;