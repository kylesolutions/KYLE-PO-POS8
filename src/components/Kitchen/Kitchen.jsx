import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

function Kitchen() {
    const navigate = useNavigate();
    const location = useLocation();
    const [kitchenNotes, setKitchenNotes] = useState([]);
    const [preparedItems, setPreparedItems] = useState([]);
    const [selectedKitchen, setSelectedKitchen] = useState(null);
    const [showStatusPopup, setShowStatusPopup] = useState(false);
    const [pickedUpOrders, setPickedUpOrders] = useState({});
    const [searchDate, setSearchDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchKitchenNotes = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(
                    "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_kitchen_notes",
                    {
                        method: "GET",
                        headers: {
                            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch Kitchen Notes: ${response.status} - ${response.statusText}`);
                }

                const data = await response.json();
                console.log("Raw response from get_kitchen_notes in Kitchen:", data);

                if (data.message?.status !== "success") {
                    throw new Error(data.message?.message || data.exception || "Invalid response from server");
                }

                // Handle empty data gracefully
                if (!data.message?.data || !Array.isArray(data.message.data) || data.message.data.length === 0) {
                    console.warn("No kitchen notes found in response:", data);
                    setKitchenNotes([]);
                    setLoading(false);
                    return;
                }

                const storedPickedUpOrders = JSON.parse(localStorage.getItem("pickedUpOrders")) || {};

                const formattedNotes = data.message.data.map((note) => ({
                    name: note.name,
                    pos_invoice_id: note.pos_invoice_id,
                    customer: note.customer_name || "Unknown",
                    custom_table_number: note.table_number || "N/A",
                    custom_delivery_type: note.delivery_type || "DINE IN",
                    posting_date: note.order_time,
                    cartItems: note.items.map((item) => {
                        const itemId = `${note.name}-${item.name}`;
                        const isPickedUp = Object.values(storedPickedUpOrders).some(o =>
                            o.items.some(i => i.id === itemId && i.status === "PickedUp")
                        );
                        return {
                            id: itemId,
                            backendId: item.name,
                            item_code: item.item_name,
                            name: item.item_name,
                            custom_customer_description: item.customer_description || "",
                            custom_variants: item.custom_variants || "",
                            basePrice: 0,
                            quantity: parseInt(item.quantity, 10) || 1,
                            selectedSize: "",
                            selectedCustomVariant: "",
                            kitchen: item.kitchen || "Unknown",
                            status: isPickedUp ? "PickedUp" : (item.status || "Prepare"),
                            addonCounts: {},
                            selectedCombos: [],
                            type: "main",
                        };
                    }),
                }));

                if (location.state?.order) {
                    const passedOrder = {
                        ...location.state.order,
                        cartItems: location.state.order.cartItems.map(item => ({
                            id: `${location.state.order.name}-${item.item_code || item.name}-${uuidv4()}`,
                            backendId: item.name,
                            item_code: item.item_code || item.name,
                            name: item.name,
                            custom_customer_description: item.custom_customer_description || "",
                            custom_variants: item.custom_variants || "",
                            basePrice: parseFloat(item.basePrice) || 0,
                            quantity: parseInt(item.quantity, 10) || 1,
                            selectedSize: item.selectedSize || "",
                            selectedCustomVariant: item.selectedCustomVariant || "",
                            kitchen: item.kitchen || "Unknown",
                            status: item.status || "Prepare",
                            addonCounts: item.addonCounts || {},
                            selectedCombos: item.selectedCombos || [],
                            type: "main",
                        })),
                    };
                    setKitchenNotes([passedOrder]);
                    setSelectedKitchen(passedOrder.cartItems[0]?.kitchen || "Unknown");
                } else {
                    setKitchenNotes(formattedNotes);
                }

                const storedPreparedItems = JSON.parse(localStorage.getItem("preparedItems")) || [];
                setPreparedItems(storedPreparedItems);
                setPickedUpOrders(storedPickedUpOrders);
            } catch (error) {
                const errorMessage = error.message || "An unexpected error occurred";
                console.error("Error fetching Kitchen Notes:", error);
                setError(`Failed to load kitchen notes: ${errorMessage}. Please try again or contact support.`);
                setKitchenNotes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchKitchenNotes();
    }, [location]);

    const kitchens = [
        ...new Set(
            kitchenNotes.flatMap((order) =>
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
    kitchenNotes.forEach((order) => {
        order.cartItems.forEach((item) => {
            if (item.kitchen === selectedKitchen && item.status !== "PickedUp") {
                filteredItemsMap.set(item.id, {
                    ...item,
                    customerName: order.customer,
                    tableNumber: order.custom_table_number,
                    deliveryType: order.custom_delivery_type,
                });
            }
        });
    });
    const filteredItems = Array.from(filteredItemsMap.values());

    const handleStatusChange = async (id, newStatus) => {
        try {
            const item = filteredItems.find((i) => i.id === id);
            if (!item) throw new Error("Item not found");

            const response = await fetch(
                "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.update_kitchen_note_status",
                {
                    method: "POST",
                    headers: {
                        Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        item_name: item.backendId,
                        status: newStatus,
                    }),
                }
            );

            const result = await response.json();
            if (result.message?.status !== "success") {
                throw new Error(result.message?.message || result.exception || "Failed to update status");
            }

            const updatedOrders = kitchenNotes.map((order) => ({
                ...order,
                cartItems: order.cartItems.map((item) => {
                    if (item.id === id) {
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

            setKitchenNotes(updatedOrders);
            localStorage.setItem("preparedItems", JSON.stringify(preparedItems));
        } catch (error) {
            console.error("Error updating status:", error);
            alert(`Unable to update item status: ${error.message || "Please try again."}`);
        }
    };

    const handlePickUp = async (id) => {
        try {
            const item = filteredItems.find((i) => i.id === id);
            if (!item) throw new Error("Item not found");

            const response = await fetch(
                "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.delete_kitchen_note_item",
                {
                    method: "POST",
                    headers: {
                        Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        item_name: item.backendId,
                    }),
                }
            );

            const result = await response.json();
            if (result.message?.status !== "success") {
                throw new Error(result.message?.message || result.exception || "Failed to delete item");
            }

            const pickupTime = new Date().toLocaleString();
            const updatedOrders = kitchenNotes.map((order) => ({
                ...order,
                cartItems: order.cartItems.map((item) => {
                    if (item.id === id) {
                        return { ...item, status: "PickedUp" };
                    }
                    return item;
                }),
            }));

            const pickedItem = filteredItems.find((item) => item.id === id);
            if (pickedItem) {
                const orderName = pickedItem.id.split("-")[0];
                setPickedUpOrders((prev) => {
                    const existingOrder = prev[orderName] || {
                        customerName: pickedItem.customerName,
                        tableNumber: pickedItem.tableNumber,
                        deliveryType: pickedItem.deliveryType,
                        items: [],
                    };
                    if (!existingOrder.items.some((i) => i.id === pickedItem.id)) {
                        existingOrder.items.push({
                            ...pickedItem,
                            pickupTime,
                            kitchen: selectedKitchen,
                            status: "PickedUp",
                        });
                    }
                    const newPickedUpOrders = { ...prev, [orderName]: existingOrder };
                    localStorage.setItem("pickedUpOrders", JSON.stringify(newPickedUpOrders));
                    return newPickedUpOrders;
                });
            }

            setKitchenNotes(updatedOrders);
        } catch (error) {
            console.error("Error marking item as picked up:", error);
            alert(`Unable to mark item as picked up: ${error.message || "Please try again."}`);
        }
    };

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
        switch (status || "Prepare") {
            case "Prepare":
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
                delete newPickedUpOrders[orderName];
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
                    ) : filteredItems.length === 0 ? (
                        <div className="alert alert-info text-center" role="alert">
                            No active kitchen orders found for {selectedKitchen || "any kitchen"}.
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
                            <div className="table-responsive">
                                <table className="table table-bordered table-hover">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Customer</th>
                                            <th>Table</th>
                                            <th>Delivery Type</th>
                                            <th>Item</th>
                                            <th>Variants</th>
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
                                                    {item.custom_customer_description && (
                                                        <p
                                                            style={{
                                                                fontSize: "12px",
                                                                color: "#666",
                                                                marginTop: "5px",
                                                                marginBottom: "0",
                                                            }}
                                                        >
                                                            <strong>Note:</strong> {item.custom_customer_description}
                                                        </p>
                                                    )}
                                                </td>
                                                <td>{item.custom_variants || "None"}</td>
                                                <td>{item.kitchen}</td>
                                                <td>{item.quantity}</td>
                                                <td>{item.type}</td>
                                                <td>
                                                    <select
                                                        value={item.status || "Prepare"}
                                                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                        className="form-select form-select-sm"
                                                    >
                                                        <option value="Prepare">Prepare</option>
                                                        <option value="Preparing">Preparing</option>
                                                        <option value="Prepared">Prepared</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    {item.status === "Prepared" && (
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => handlePickUp(item.id)}
                                                        >
                                                            Mark as Picked Up
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
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
                                                    <th>Variants</th>
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
                                                                {item.custom_customer_description && (
                                                                    <p
                                                                        style={{
                                                                            fontSize: "12px",
                                                                            color: "#666",
                                                                            marginTop: "5px",
                                                                            marginBottom: "0",
                                                                        }}
                                                                    >
                                                                        <strong>Note:</strong> {item.custom_customer_description}
                                                                    </p>
                                                                )}
                                                            </td>
                                                            <td>{item.custom_variants || "None"}</td>
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