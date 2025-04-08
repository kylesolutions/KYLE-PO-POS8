import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

function Kitchen() {
    const navigate = useNavigate();
    const location = useLocation();
    const [savedOrders, setSavedOrders] = useState([]);
    const [preparedItems, setPreparedItems] = useState([]);
    const [selectedKitchen, setSelectedKitchen] = useState(null);
    const [showStatusPopup, setShowStatusPopup] = useState(false);
    const [pickedUpOrders, setPickedUpOrders] = useState({}); // Changed to an object to group by order
    const [searchDate, setSearchDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSavedOrders = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(
                    "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoices",
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
                console.log("Raw response from get_pos_invoices in Kitchen:", data);

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
                console.log("Filtered draft orders in Kitchen:", draftOrders);

                const formattedOrders = draftOrders.map((order) => {
                    const cartItems = order.items.map((item) => ({
                        item_code: item.item_code,
                        name: item.item_name,
                        basePrice: parseFloat(item.rate) || 0,
                        quantity: parseInt(item.qty, 10) || 1,
                        selectedSize: item.custom_size_variants || "",
                        selectedCustomVariant: item.custom_other_variants || "",
                        kitchen: item.custom_kitchen || "Unknown",
                        status: item.custom_status || "Pending",
                        addonCounts: {},
                        selectedCombos: [],
                    }));

                    return {
                        name: order.name,
                        customer: order.customer,
                        custom_table_number: order.custom_table_number,
                        contact_mobile: order.contact_mobile,
                        custom_delivery_type: order.custom_delivery_type || "DINE IN",
                        customer_address: order.customer_address || "",
                        contact_email: order.contact_email || "",
                        posting_date: order.posting_date,
                        cartItems,
                    };
                });

                const uniqueOrders = Array.from(
                    new Map(formattedOrders.map((order) => [order.name, order])).values()
                );

                if (location.state?.order) {
                    const passedOrder = location.state.order;
                    setSavedOrders([passedOrder]);
                    setSelectedKitchen(passedOrder.cartItems[0]?.kitchen || "Unknown");
                } else {
                    setSavedOrders(uniqueOrders);
                }

                const storedPreparedItems = JSON.parse(localStorage.getItem("preparedItems")) || [];
                const storedPickedUpOrders = JSON.parse(localStorage.getItem("pickedUpOrders")) || {};
                setPreparedItems(storedPreparedItems);
                setPickedUpOrders(storedPickedUpOrders);
            } catch (error) {
                console.error("Error fetching POS Invoices in Kitchen:", error.message);
                setError(`Failed to load saved orders: ${error.message}. Please try again or contact support.`);
                setSavedOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSavedOrders();
    }, [location]);

    const kitchens = [
        ...new Set(
            savedOrders.flatMap((order) =>
                order.cartItems.map((item) => item.kitchen || "Unknown")
            )
        ),
    ];

    useEffect(() => {
        if (kitchens.length > 0 && !selectedKitchen && !location.state?.order) {
            setSelectedKitchen(kitchens[0]);
        }
    }, [kitchens, selectedKitchen, location.state]);

    const filteredItemsMap = new Map();
    savedOrders.forEach((order) => {
        order.cartItems.forEach((item) => {
            const id = `${order.name}-${item.item_code || item.name}`;
            if (item.kitchen === selectedKitchen && item.status !== "PickedUp") {
                filteredItemsMap.set(id, {
                    ...item,
                    type: "main",
                    customerName: order.customer,
                    tableNumber: order.custom_table_number,
                    deliveryType: order.custom_delivery_type,
                    id,
                });
            }
        });
    });
    const filteredItems = Array.from(filteredItemsMap.values());

    const handleStatusChange = (id, newStatus) => {
        const updatedOrders = savedOrders.map((order) => ({
            ...order,
            cartItems: order.cartItems.map((item) => {
                if (`${order.name}-${item.item_code || item.name}` === id) {
                    return { ...item, status: newStatus };
                }
                return item;
            }),
        }));

        if (newStatus === "Prepared") {
            setPreparedItems((prev) => [...new Set([...prev, id])]);
        } else {
            setPreparedItems((prev) => prev.filter((itemId) => itemId !== id));
        }

        setSavedOrders(updatedOrders);
        localStorage.setItem("preparedItems", JSON.stringify(preparedItems));
    };

    const handlePickUp = (id) => {
        const pickupTime = new Date().toLocaleString();
        const updatedOrders = savedOrders.map((order) => ({
            ...order,
            cartItems: order.cartItems.map((item) => {
                if (`${order.name}-${item.item_code || item.name}` === id) {
                    return { ...item, status: "PickedUp" };
                }
                return item;
            }),
        }));

        const pickedItem = filteredItems.find((item) => item.id === id);
        if (pickedItem) {
            const orderName = pickedItem.id.split("-")[0]; // Extract order name from id
            setPickedUpOrders((prev) => {
                const existingOrder = prev[orderName] || {
                    customerName: pickedItem.customerName,
                    tableNumber: pickedItem.tableNumber,
                    deliveryType: pickedItem.deliveryType,
                    items: [],
                };
                // Only add item if not already in the order's items list
                if (!existingOrder.items.some((i) => i.id === pickedItem.id)) {
                    existingOrder.items.push({
                        ...pickedItem,
                        pickupTime,
                        kitchen: selectedKitchen,
                    });
                }
                const newPickedUpOrders = { ...prev, [orderName]: existingOrder };
                localStorage.setItem("pickedUpOrders", JSON.stringify(newPickedUpOrders));
                return newPickedUpOrders;
            });
        }

        setSavedOrders(updatedOrders);
    };

    // Flatten pickedUpOrders for filtering by date
    const filteredPickedUpOrders = Object.entries(pickedUpOrders)
        .map(([orderName, order]) => ({
            orderName,
            ...order,
            items: order.items.filter((item) =>
                item.pickupTime.toLowerCase().includes(searchDate.toLowerCase())
            ),
        }))
        .filter((order) => order.items.length > 0);

    const getRowStyle = (status) => {
        switch (status || "Pending") {
            case "Pending":
                return { backgroundColor: "#f8d7da" };
            case "Preparing":
                return { backgroundColor: "#fff3cd" };
            case "Prepared":
                return { backgroundColor: "#d4edda" };
            default:
                return {};
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleDeleteItem = (orderName, itemIndex) => {
        setPickedUpOrders((prev) => {
            const updatedOrder = { ...prev[orderName] };
            updatedOrder.items = updatedOrder.items.filter((_, i) => i !== itemIndex);
            const newPickedUpOrders = { ...prev, [orderName]: updatedOrder };
            if (updatedOrder.items.length === 0) {
                delete newPickedUpOrders[orderName]; // Remove order if no items remain
            }
            localStorage.setItem("pickedUpOrders", JSON.stringify(newPickedUpOrders));
            return newPickedUpOrders;
        });
    };

    return (
        <div className="container mt-5">
            <div className="card shadow-lg">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <button className="btn btn-light btn-sm" onClick={handleBack}>
                        <i className="bi bi-arrow-left"></i> Back
                    </button>
                    <h3 className="mb-0">Kitchen Dashboard</h3>
                    <button className="btn btn-info btn-sm" onClick={() => setShowStatusPopup(true)}>
                        <i className="bi bi-info-circle"></i> Status
                    </button>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2 text-muted">Loading kitchen orders...</p>
                        </div>
                    ) : error ? (
                        <div className="alert alert-danger text-center" role="alert">
                            {error}
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <h5 className="fw-bold">Select Kitchen:</h5>
                                <div className="btn-group flex-wrap gap-2">
                                    {kitchens.map((kitchen) => (
                                        <button
                                            key={kitchen}
                                            className={`btn btn-outline-primary ${selectedKitchen === kitchen ? "active" : ""}`}
                                            onClick={() => setSelectedKitchen(kitchen)}
                                        >
                                            {kitchen}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <h5 className="mb-3">Current Orders - {selectedKitchen || "Select a Kitchen"}</h5>
                            {filteredItems.length === 0 ? (
                                <p className="text-muted">No orders for this kitchen.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-bordered table-hover">
                                        <thead className="table-dark">
                                            <tr>
                                                <th>Customer</th>
                                                <th>Table</th>
                                                <th>Delivery Type</th>
                                                <th>Item</th>
                                                <th>Kitchen</th>
                                                <th>Quantity</th>
                                                <th>Type</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredItems.map((item) => (
                                                <tr key={item.id} style={getRowStyle(item.status)}>
                                                    <td>{item.customerName || "Unknown"}</td>
                                                    <td>{item.tableNumber || "N/A"}</td>
                                                    <td>{item.deliveryType}</td>
                                                    <td>
                                                        {item.name}
                                                        {item.selectedSize && ` (${item.selectedSize})`}
                                                        {item.selectedCustomVariant && ` (${item.selectedCustomVariant})`}
                                                    </td>
                                                    <td>{item.kitchen}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{item.type}</td>
                                                    <td>
                                                        <select
                                                            value={item.status || "Pending"}
                                                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                            className="form-select form-select-sm"
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Preparing">Preparing</option>
                                                            <option value="Prepared">Prepared</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        {item.status === "Prepared" && item.status !== "PickedUp" && (
                                                            <button
                                                                className="btn btn-success btn-sm"
                                                                onClick={() => handlePickUp(item.id)}
                                                            >
                                                                Mark as Picked Up
                                                            </button>
                                                        )}
                                                        {item.status === "PickedUp" && (
                                                            <span className="text-success">Picked Up ✅</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showStatusPopup && (
                <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header bg-info text-white">
                                <h5 className="modal-title">Picked Up Items Status</h5>
                                <button
                                    type="button"
                                    className="btn-close bg-white"
                                    onClick={() => setShowStatusPopup(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search by Date (e.g., MM/DD/YYYY)"
                                        value={searchDate}
                                        onChange={(e) => setSearchDate(e.target.value)}
                                    />
                                </div>
                                {filteredPickedUpOrders.length === 0 ? (
                                    <p className="text-muted">No items have been picked up yet.</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-bordered table-striped">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th>Order</th>
                                                    <th>Customer</th>
                                                    <th>Table</th>
                                                    <th>Delivery Type</th>
                                                    <th>Item</th>
                                                    <th>Kitchen</th>
                                                    <th>Quantity</th>
                                                    <th>Type</th>
                                                    <th>Pickup Time</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredPickedUpOrders.map((order) =>
                                                    order.items.map((item, itemIndex) => (
                                                        <tr key={`${order.orderName}-${itemIndex}`}>
                                                            {itemIndex === 0 && (
                                                                <>
                                                                    <td rowSpan={order.items.length}>{order.orderName}</td>
                                                                    <td rowSpan={order.items.length}>{order.customerName || "Unknown"}</td>
                                                                    <td rowSpan={order.items.length}>{order.tableNumber || "N/A"}</td>
                                                                    <td rowSpan={order.items.length}>{order.deliveryType}</td>
                                                                </>
                                                            )}
                                                            <td>
                                                                {item.name}
                                                                {item.selectedSize && ` (${item.selectedSize})`}
                                                                {item.selectedCustomVariant && ` (${item.selectedCustomVariant})`}
                                                            </td>
                                                            <td>{item.kitchen}</td>
                                                            <td>{item.quantity}</td>
                                                            <td>{item.type}</td>
                                                            <td>{item.pickupTime}</td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() => handleDeleteItem(order.orderName, itemIndex)}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowStatusPopup(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Kitchen;

