import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Kitchen() {
    const navigate = useNavigate();
    const [savedOrders, setSavedOrders] = useState([]);
    const [preparedItems, setPreparedItems] = useState([]);
    const [selectedKitchen, setSelectedKitchen] = useState(null);
    const [showStatusPopup, setShowStatusPopup] = useState(false);
    const [pickedUpItems, setPickedUpItems] = useState([]);
    const [searchDate, setSearchDate] = useState("");

    useEffect(() => {
        const storedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
        const storedPreparedItems = JSON.parse(localStorage.getItem("preparedItems")) || [];
        const storedPickedUpItems = JSON.parse(localStorage.getItem("pickedUpItems")) || [];
        setSavedOrders(storedOrders);
        setPreparedItems(storedPreparedItems);
        setPickedUpItems(storedPickedUpItems);
    }, []);

    // Extract unique kitchens from all items (main, addons, combos)
    const kitchens = [
        ...new Set(
            savedOrders.flatMap((order) =>
                [
                    ...order.cartItems.map((item) => item.kitchen),
                    ...Object.values(order.cartItems.flatMap((item) => 
                        Object.values(item.addonCounts || {}).map((addon) => addon.kitchen || "Unknown")
                    )),
                    ...order.cartItems.flatMap((item) => 
                        (item.selectedCombos || []).map((combo) => combo.kitchen || "Unknown")
                    ),
                ].filter((kitchen) => kitchen)
            )
        ),
    ];

    useEffect(() => {
        if (kitchens.length > 0 && !selectedKitchen) {
            setSelectedKitchen(kitchens[0]);
        }
    }, [kitchens, selectedKitchen]);

    // Flatten items, addons, and combos into a single list with kitchen filtering
    const filteredItems = savedOrders.flatMap((order) =>
        [
            ...order.cartItems.map((item) => ({
                ...item,
                type: "main",
                customerName: order.customerName,
                tableNumber: order.tableNumber,
                id: item.id || `${order.tableNumber}-${item.name}`, // Ensure unique ID
            })),
            ...order.cartItems.flatMap((item) =>
                Object.entries(item.addonCounts || {}).map(([addonName, { price, quantity, kitchen }]) => ({
                    name: addonName,
                    quantity,
                    kitchen: kitchen || "Unknown",
                    type: "addon",
                    customerName: order.customerName,
                    tableNumber: order.tableNumber,
                    id: `${order.tableNumber}-${addonName}-${item.name}`, // Unique ID for addon
                    status: item.status, // Inherit status from main item initially
                }))
            ),
            ...order.cartItems.flatMap((item) =>
                (item.selectedCombos || []).map((combo) => ({
                    name: combo.name1,
                    quantity: combo.quantity || 1,
                    kitchen: combo.kitchen || "Unknown",
                    type: "combo",
                    selectedVariant: combo.selectedVariant,
                    customerName: order.customerName,
                    tableNumber: order.tableNumber,
                    id: `${order.tableNumber}-${combo.name1}-${item.name}`, // Unique ID for combo
                    status: item.status, // Inherit status from main item initially
                }))
            ),
        ]
    ).filter(
        (item) =>
            item.kitchen === selectedKitchen &&
            item.category !== "Drinks" && // Assuming addons/combos don't have category "Drinks"
            item.status !== "PickedUp"
    );

    const handleStatusChange = (id, newStatus) => {
        const updatedOrders = savedOrders.map((order) => ({
            ...order,
            cartItems: order.cartItems.map((item) => {
                // Update status for main item, addons, and combos independently
                const updatedItem = { ...item };
                if (item.id === id) updatedItem.status = newStatus;
                if (Object.values(item.addonCounts || {}).some((addon) => `${order.tableNumber}-${addon.name}-${item.name}` === id)) {
                    updatedItem.addonCounts = {
                        ...item.addonCounts,
                        [Object.keys(item.addonCounts).find((key) => `${order.tableNumber}-${key}-${item.name}` === id)]: {
                            ...item.addonCounts[Object.keys(item.addonCounts).find((key) => `${order.tableNumber}-${key}-${item.name}` === id)],
                            status: newStatus,
                        },
                    };
                }
                if ((item.selectedCombos || []).some((combo) => `${order.tableNumber}-${combo.name1}-${item.name}` === id)) {
                    updatedItem.selectedCombos = item.selectedCombos.map((combo) =>
                        `${order.tableNumber}-${combo.name1}-${item.name}` === id ? { ...combo, status: newStatus } : combo
                    );
                }
                return updatedItem;
            }),
        }));

        if (newStatus === "Prepared") {
            setPreparedItems((prev) => [...new Set([...prev, id])]);
        } else {
            setPreparedItems((prev) => prev.filter((itemId) => itemId !== id));
        }

        setSavedOrders(updatedOrders);
        localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
        localStorage.setItem("preparedItems", JSON.stringify(preparedItems));
    };

    const handlePickUp = (id) => {
        const pickupTime = new Date().toLocaleString();
        const updatedOrders = savedOrders.map((order) => ({
            ...order,
            cartItems: order.cartItems.map((item) => {
                const updatedItem = { ...item };
                if (item.id === id) updatedItem.status = "PickedUp";
                if (Object.values(item.addonCounts || {}).some((addon) => `${order.tableNumber}-${addon.name}-${item.name}` === id)) {
                    updatedItem.addonCounts = {
                        ...item.addonCounts,
                        [Object.keys(item.addonCounts).find((key) => `${order.tableNumber}-${key}-${item.name}` === id)]: {
                            ...item.addonCounts[Object.keys(item.addonCounts).find((key) => `${order.tableNumber}-${key}-${item.name}` === id)],
                            status: "PickedUp",
                        },
                    };
                }
                if ((item.selectedCombos || []).some((combo) => `${order.tableNumber}-${combo.name1}-${item.name}` === id)) {
                    updatedItem.selectedCombos = item.selectedCombos.map((combo) =>
                        `${order.tableNumber}-${combo.name1}-${item.name}` === id ? { ...combo, status: "PickedUp" } : combo
                    );
                }
                return updatedItem;
            }),
        }));

        const pickedItem = filteredItems.find((item) => item.id === id);
        if (pickedItem) {
            const newPickedUpItem = {
                ...pickedItem,
                pickupTime,
                kitchen: selectedKitchen,
            };
            setPickedUpItems((prev) => {
                const newItems = [...prev, newPickedUpItem];
                localStorage.setItem("pickedUpItems", JSON.stringify(newItems));
                return newItems;
            });
        }

        setSavedOrders(updatedOrders);
        localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
    };

    const filteredPickedUpItems = pickedUpItems.filter((item) =>
        item.pickupTime.toLowerCase().includes(searchDate.toLowerCase())
    );

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

    const handleDeleteItem = (index) => {
        const updatedItems = filteredPickedUpItems.filter((_, i) => i !== index);
        setPickedUpItems(updatedItems);
        localStorage.setItem("pickedUpItems", JSON.stringify(updatedItems));
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <button
                    className="btn btn-secondary"
                    onClick={handleBack}
                    style={{ marginRight: "auto" }}
                >
                    Back
                </button>
                <h3 className="text-center" style={{ flex: "1" }}>
                    Kitchen Note
                </h3>
                <button
                    className="btn btn-info"
                    onClick={() => setShowStatusPopup(true)}
                >
                    Status
                </button>
            </div>

            <div className="d-flex mb-3 gap-3">
                {kitchens.map((kitchen) => (
                    <button
                        key={kitchen}
                        className={`btn btn-sm ${selectedKitchen === kitchen ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setSelectedKitchen(kitchen)}
                    >
                        {kitchen}
                    </button>
                ))}
            </div>

            <h5>Current Orders - {selectedKitchen || "Select a Kitchen"}</h5>
            {filteredItems.length === 0 ? (
                <p>No orders for this kitchen.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Table</th>
                                <th>Item</th>
                                <th>Image</th>
                                <th>Quantity</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item, index) => (
                                <tr key={index} style={getRowStyle(item.status)}>
                                    <td>{item.customerName || "Unknown"}</td>
                                    <td>{item.tableNumber || "N/A"}</td>
                                    <td>
                                        {item.name}
                                        {item.type === "combo" && item.selectedVariant && ` (${item.selectedVariant})`}
                                    </td>
                                    <td>
                                        {item.image && (
                                            <img
                                                src={item.image}
                                                className="rounded"
                                                style={{
                                                    width: "70px",
                                                    height: "50px",
                                                    objectFit: "cover",
                                                    border: "1px solid #ddd",
                                                }}
                                                alt={item.name}
                                            />
                                        )}
                                    </td>
                                    <td>{item.quantity}</td>
                                    <td>{item.type}</td>
                                    <td>
                                        <select
                                            value={item.status || "Pending"}
                                            onChange={(e) =>
                                                handleStatusChange(item.id, e.target.value)
                                            }
                                            className="form-select"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Preparing">Preparing</option>
                                            <option value="Prepared">Prepared</option>
                                        </select>
                                    </td>
                                    <td>
                                        {item.status === "Prepared" && item.status !== "PickedUp" && (
                                            <button
                                                className="btn btn-success"
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

            {showStatusPopup && (
                <div className="modal" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Picked Up Items Status</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowStatusPopup(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search by Date"
                                        value={searchDate}
                                        onChange={(e) => setSearchDate(e.target.value)}
                                    />
                                </div>

                                {filteredPickedUpItems.length === 0 ? (
                                    <p>No items have been picked up yet.</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Customer</th>
                                                    <th>Table</th>
                                                    <th>Item</th>
                                                    <th>Quantity</th>
                                                    <th>Type</th>
                                                    <th>Kitchen</th>
                                                    <th>Pickup Time</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredPickedUpItems.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.customerName || "Unknown"}</td>
                                                        <td>{item.tableNumber || "N/A"}</td>
                                                        <td>
                                                            {item.name}
                                                            {item.type === "combo" && item.selectedVariant && ` (${item.selectedVariant})`}
                                                        </td>
                                                        <td>{item.quantity}</td>
                                                        <td>{item.type}</td>
                                                        <td>{item.kitchen}</td>
                                                        <td>{item.pickupTime}</td>
                                                        <td>
                                                            <button
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => handleDeleteItem(index)}
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