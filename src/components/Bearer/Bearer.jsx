import React, { useContext, useState, useEffect } from "react";
import UserContext from "../../Context/UserContext";
import { useNavigate } from "react-router-dom";

function Bearer() {
    const { bearerOrders, markAsPickedUp } = useContext(UserContext);
    const [successMessage, setSuccessMessage] = useState(null);
    const [allPickedUp, setAllPickedUp] = useState(false);
    const navigate = useNavigate()

    const groupedBearerOrders = bearerOrders.reduce((groups, item) => {
        const key = `${item.customerName || "Unknown Customer"}|${item.tableNumber || "Unknown Table"}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return groups;
    }, {});

    const handlePickUp = (id) => {
        if (!id) {
            console.error("Invalid item ID for pick up.");
            return;
        }
        markAsPickedUp(id);
        setSuccessMessage("Item has been marked as picked up!");
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    useEffect(() => {
        const allPicked = bearerOrders.every((item) => item.isPickedUp);
        setAllPickedUp(allPicked);
    }, [bearerOrders]);

    return (
        <div className="container mt-4">
            <h3 className="text-center">Bearer Page</h3>
            {successMessage && (
                <div className="alert alert-success text-center">
                    {successMessage}
                </div>
            )}

            {Object.keys(groupedBearerOrders).length === 0 ? (
                <p className="text-center">No prepared items to display.</p>
            ) : (
                Object.entries(groupedBearerOrders).map(([key, items], index) => {
                    const [customer, tableNumber] = key.split("|");

                    return (
                        <div key={index} className="mb-4">
                            <h5>Customer: {customer}</h5>
                            <h5>Table: {tableNumber}</h5>
                            {items.map((item) => (
                                <div key={item.id || item.name} className="card p-3 mb-3">
                                    <h6>Order ID: {item.id || "N/A"}</h6>
                                    <h6>{item.name || "Unnamed Item"}</h6>
                                    <p>
                                        <strong>Size:</strong> {item.selectedSize || "Unknown"}
                                    </p>
                                    <button
                                        className="btn btn-success mt-2"
                                        onClick={() => handlePickUp(item.id)}
                                    >
                                        Mark as Picked Up
                                    </button>
                                </div>
                            ))}
                        </div>
                    );
                })
            )}

            {allPickedUp && (
                <div className="text-center mt-4">
                    <button className="btn btn-primary" onClick={() => navigate("/frontpage")}>
                        Home
                    </button>
                </div>
            )}
        </div>
    );
}

export default Bearer;
