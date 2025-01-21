import React, { useContext } from "react";
import UserContext from "../../Context/UserContext";
import { useLocation, useNavigate } from "react-router-dom";

function Kitchen() {
    const { savedOrders, updateOrderStatus, informBearer, preparedItems } = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const { tableNumber, customerName } = location.state || {};

    const groupedOrders = savedOrders.reduce((groups, order) => {
        const customer = order.customerName || "Unknown Customer";
        if (!groups[customer]) groups[customer] = [];
        groups[customer].push({
            ...order,
            cartItems: order.cartItems.filter(
                (item) =>
                    item.category !== "Drinks" && 
                    item.status !== "PickedUp"   
            ),
        });
        return groups;
    }, {});
    
    const handleStatusChange = (id, newStatus) => {
        updateOrderStatus(id, newStatus);
    };

    const handleInformBearer = () => {
        const preparedOrders = savedOrders
            .map((order) => ({
                ...order,
                cartItems: order.cartItems.filter(
                    (item) => preparedItems.includes(item.id) && item.category !== "Drinks"
                ),
            }))
            .filter((order) => order.cartItems.length > 0);
    
        if (preparedOrders.length === 0) {
            console.warn("No prepared items to inform the bearer about.");
            return;
        }
    
        preparedOrders.forEach((order) => {
            order.cartItems.forEach((item) => informBearer(item));
        });
    
        alert("Items have been marked as Prepared. The bearer has been informed!");
    
        navigate("/bearer", {
            state: {
                customerName, 
                tableNumber,
            },
        });
    };
    
    return (
        <div className="container mt-4">
            <h3 className="text-center">Kitchen Note</h3>
            <h5>Current Orders</h5>
            {Object.keys(groupedOrders).length === 0 ? (
                <p>No orders to display.</p>
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
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedOrders).map(([customer, orders], customerIndex) =>
                                orders.map((order, orderIndex) =>
                                    order.cartItems.map((item, itemIndex) => (
                                        <tr key={`${customerIndex}-${orderIndex}-${itemIndex}`}>
                                            {itemIndex === 0 && (
                                                <>
                                                    <td rowSpan={order.cartItems.length}>{customer}</td>
                                                    <td rowSpan={order.cartItems.length}>
                                                        {order.tableNumber}
                                                    </td>
                                                </>
                                            )}
                                            <td>{item.name}</td>
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
                                        </tr>
                                    ))
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            {preparedItems.length > 0 && (
                <div className="text-center mt-4">
                    <button className="btn btn-primary" onClick={handleInformBearer}>
                        Inform Bearer
                    </button>
                </div>
            )}
        </div>
    );
}

export default Kitchen;
