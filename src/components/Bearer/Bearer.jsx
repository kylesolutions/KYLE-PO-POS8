import React, { useContext, useState, useEffect } from "react";
import UserContext from "../../Context/UserContext";
import { useLocation, useNavigate } from "react-router-dom";

function Bearer() {
    const { bearerOrders, markAsPickedUp } = useContext(UserContext);
    const [successMessage, setSuccessMessage] = useState(null);
    const [allPickedUp, setAllPickedUp] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { customerTableData = [] } = location.state || {}; 

    const groupedBearerOrders = bearerOrders.reduce((groups, item) => {
        if (!item.id) return groups;
        groups[item.id] = item;
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
             
            {customerTableData.length > 0 && (
                <div className="text-center mb-4">
                    <h5>Orders from:</h5>
                    {customerTableData.map((data, index) => (
                        <p key={index}><strong>{data.customerName}</strong> - Table {data.tableNumber}</p>
                    ))}
                </div>
            )}

            {bearerOrders.length === 0 ? (
                <p className="text-center">No prepared items to display.</p>
            ) : (
                bearerOrders.map((item) => {
                    const matchedData = customerTableData.find(
                        (data) => data.orderId === item.id
                    );

                    return (
                        <div key={item.id} className="card p-3 mb-3">
                            <h6><strong>Order ID:</strong> {item.id || "N/A"}</h6>
                            <h6><strong>Item:</strong> {item.name || "Unnamed Item"}</h6>
                            <p><strong>Size:</strong> {item.selectedSize || "Unknown"}</p>
    
                            <p><strong>Customer:</strong> {matchedData ? matchedData.customerName : "Unknown"}</p>
                            <p><strong>Table Number:</strong> {matchedData ? matchedData.tableNumber : "Unknown"}</p>

                            <button
                                className="btn btn-success mt-2"
                                onClick={() => handlePickUp(item.id)}
                            >
                                Mark as Picked Up
                            </button>
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
