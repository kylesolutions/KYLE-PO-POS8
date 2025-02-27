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

    const kitchens = [
        ...new Set(
            savedOrders.flatMap((order) =>
                order.cartItems.map((item) => item.kitchen).filter((kitchen) => kitchen)
            )
        ),
    ];

    useEffect(() => {
        if (kitchens.length > 0 && !selectedKitchen) {
            setSelectedKitchen(kitchens[0]);
        }
    }, [kitchens, selectedKitchen]);

    const filteredOrders = savedOrders
        .map((order) => ({
            ...order,
            cartItems: order.cartItems.filter(
                (item) =>
                    item.kitchen === selectedKitchen &&
                    item.category !== "Drinks" &&
                    item.status !== "PickedUp"
            ),
        }))
        .filter((order) => order.cartItems.length > 0);

    const handleStatusChange = (id, newStatus) => {
        const updatedOrders = savedOrders.map((order) => ({
            ...order,
            cartItems: order.cartItems.map((item) =>
                item.id === id ? { ...item, status: newStatus } : item
            ),
        }));

        if (newStatus === "Prepared") {
            setPreparedItems((prev) => [...new Set([...prev, id])]);
        } else if (newStatus !== "Prepared") {
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
            cartItems: order.cartItems.map((item) =>
                item.id === id ? { ...item, status: "PickedUp" } : item
            ),
        }));

        const orderWithItem = savedOrders.find(order =>
            order.cartItems.some(item => item.id === id)
        );
        const pickedItem = orderWithItem?.cartItems.find(item => item.id === id);

        if (pickedItem && orderWithItem) {
            const newPickedUpItem = {
                ...pickedItem,
                pickupTime: pickupTime,
                kitchen: selectedKitchen,
                customerName: orderWithItem.customerName || "Unknown",
                tableNumber: orderWithItem.tableNumber || "N/A"
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
                    style={{ marginRight: 'auto' }}
                >
                    Back
                </button>
                <h3 className="text-center" style={{ flex: '1' }}>
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
            {filteredOrders.length === 0 ? (
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
                                <th>Category</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order, orderIndex) =>
                                order.cartItems.map((item, itemIndex) => (
                                    <tr
                                        key={`${orderIndex}-${itemIndex}`}
                                        style={getRowStyle(item.status)}
                                    >
                                        {itemIndex === 0 && (
                                            <>
                                                <td rowSpan={order.cartItems.length}>
                                                    {order.customerName || "Unknown"}
                                                </td>
                                                <td rowSpan={order.cartItems.length}>
                                                    {order.tableNumber || "N/A"}
                                                </td>
                                            </>
                                        )}
                                        <td>{item.name}
                                            {item.addonCounts && Object.keys(item.addonCounts).length > 0 && (
                                                <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#888" }}>
                                                    {Object.entries(item.addonCounts).map(([addonName, addonPrice]) => (
                                                        <li key={addonName}>+ {addonName} (${addonPrice})</li>
                                                    ))}
                                                </ul>
                                            )}

                                            {item.selectedCombos && item.selectedCombos.length > 0 && (
                                                <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#555" }}>
                                                    {item.selectedCombos.map((combo, idx) => (
                                                        <li key={idx}>+ {combo.name1} ({combo.size}) - ${combo.price}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </td>
                                        <td>
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
                                        </td>
                                        <td>{item.quantity}</td>
                                        <td>{item.category}</td>
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showStatusPopup && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
                                                    <th>Category</th>
                                                    <th>Kitchen</th>
                                                    <th>Pickup Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredPickedUpItems.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.customerName || "Unknown"}</td>
                                                        <td>{item.tableNumber || "N/A"}</td>
                                                        <td>{item.name}
                                                            {item.addonCounts && Object.keys(item.addonCounts).length > 0 && (
                                                                <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#888" }}>
                                                                    {Object.entries(item.addonCounts).map(([addonName, addonPrice]) => (
                                                                        <li key={addonName}> {addonName}</li>
                                                                    ))}
                                                                </ul>
                                                            )}

                                                            {item.selectedCombos && item.selectedCombos.length > 0 && (
                                                                <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#555" }}>
                                                                    {item.selectedCombos.map((combo, idx) => (
                                                                        <li key={idx}> {combo.name1} ({combo.size})</li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </td>
                                                        <td>{item.quantity}</td>
                                                        <td>{item.category}</td>
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
