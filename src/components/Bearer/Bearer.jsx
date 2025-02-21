import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UserContext from "../../Context/UserContext";

function Bearer() {
    const navigate = useNavigate();
    const location = useLocation();
    const { customerTableData = [], preparedOrders = [] } = location.state || {};
    const { markItemAsPickedUp } = useContext(UserContext);

    // Store orders locally
    const [orders, setOrders] = useState(preparedOrders);
    const [successMessage, setSuccessMessage] = useState(null);
    const [allPickedUp, setAllPickedUp] = useState(false);

    useEffect(() => {
        // Check if all items are picked up
        const allPicked = orders.every(item => item.isPickedUp);
        setAllPickedUp(allPicked);
    }, [orders]);

    const handlePickUp = (id) => {
        setOrders(prevOrders =>
            prevOrders.map(item =>
                item.id === id ? { ...item, isPickedUp: true } : item
            )
        );

        setSuccessMessage("Item has been marked as picked up!");
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    return (
        <div className="container mt-4">
            <h3 className="text-center">Bearer Page</h3>

            {successMessage && (
                <div className="alert alert-success text-center">{successMessage}</div>
            )}

            {/* Show customer & table details */}
            {customerTableData.length > 0 && (
                <div className="text-center mb-4">
                    <h5>Orders from:</h5>
                    {customerTableData.map((data, index) => (
                        <p key={index}>
                            <strong>{data.customerName}</strong> - Table {data.tableNumber}
                        </p>
                    ))}
                </div>
            )}

            {/* Show prepared orders */}
            {orders.length === 0 ? (
                <p className="text-center">No prepared items to display.</p>
            ) : (
                orders.map(item => (
                    <div key={item.id} className="card p-3 mb-3">
                        <h6><strong>Item:</strong> {item.name}</h6>
                        <p><strong>Size:</strong> {item.selectedSize}</p>
                        <p><strong>Customer:</strong> {item.customerName}</p>
                        <p><strong>Table Number:</strong> {item.tableNumber}</p>

                        <button
                            className="btn btn-success mt-2"
                            onClick={() => handlePickUp(item.id)}
                            disabled={item.isPickedUp}
                        >
                            {item.isPickedUp ? "Picked Up ✅" : "Mark as Picked Up"}
                        </button>
                    </div>
                ))
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
