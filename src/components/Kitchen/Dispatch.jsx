import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dispatch() {
    const navigate = useNavigate();
    const [preparedOrders, setPreparedOrders] = useState({});
    const [searchInvoiceId, setSearchInvoiceId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);

    const fetchPreparedOrders = () => {
        try {
            setLoading(true);
            setError(null);
            const storedPreparedOrders = JSON.parse(localStorage.getItem("preparedOrders")) || {};
            setPreparedOrders(storedPreparedOrders);
            console.log("Dispatch.jsx: Loaded preparedOrders:", JSON.stringify(storedPreparedOrders, null, 2));
        } catch (error) {
            console.error("Dispatch.jsx: Error loading preparedOrders:", error);
            setError("Failed to load prepared orders. Please try again.");
            setPreparedOrders({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPreparedOrders();
        const intervalId = setInterval(fetchPreparedOrders, 30000);
        return () => clearInterval(intervalId);
    }, []);

    const filteredPreparedOrders = Object.entries(preparedOrders)
        .filter(([orderName]) =>
            orderName.toLowerCase().includes(searchInvoiceId.toLowerCase())
        )
        .map(([orderName, order]) => ({
            orderName,
            ...order,
        }));

    const handleSelectItem = (orderName, itemId) => {
        setSelectedItems((prev) => {
            const itemKey = `${orderName}-${itemId}`;
            if (prev.some((item) => item.orderName === orderName && item.itemId === itemId)) {
                return prev.filter((item) => !(item.orderName === orderName && item.itemId === itemId));
            }
            return [...prev, { orderName, itemId }];
        });
    };

    const handleSelectAll = (order, isChecked) => {
        setSelectedItems((prev) => {
            const orderItems = order.items.map((item) => ({
                orderName: order.orderName,
                itemId: item.id,
            }));
            if (isChecked) {
                const newItems = [
                    ...prev.filter((item) => item.orderName !== order.orderName),
                    ...orderItems,
                ];
                return newItems;
            }
            return prev.filter((item) => item.orderName !== order.orderName);
        });
    };

    const handleDispatchItem = (orderName, itemId) => {
        setPreparedOrders((prev) => {
            const updatedOrder = { ...prev[orderName] };
            updatedOrder.items = updatedOrder.items.filter((item) => item.id !== itemId);
            const newPreparedOrders = { ...prev, [orderName]: updatedOrder };
            if (updatedOrder.items.length === 0) {
                delete newPreparedOrders[orderName];
            }
            localStorage.setItem("preparedOrders", JSON.stringify(newPreparedOrders));
            console.log("Dispatch.jsx: Updated preparedOrders after dispatch:", JSON.stringify(newPreparedOrders, null, 2));
            return newPreparedOrders;
        });
        setSelectedItems((prev) => prev.filter((item) => !(item.orderName === orderName && item.itemId === itemId)));
    };

    const handleDispatchSelected = () => {
        if (selectedItems.length === 0) {
            alert("No items selected for dispatch.");
            return;
        }

        const confirmDispatch = window.confirm(
            `Are you sure you want to dispatch ${selectedItems.length} selected item(s)?`
        );
        if (!confirmDispatch) return;

        setPreparedOrders((prev) => {
            const newPreparedOrders = { ...prev };
            selectedItems.forEach(({ orderName, itemId }) => {
                if (newPreparedOrders[orderName]) {
                    newPreparedOrders[orderName].items = newPreparedOrders[orderName].items.filter(
                        (item) => item.id !== itemId
                    );
                    if (newPreparedOrders[orderName].items.length === 0) {
                        delete newPreparedOrders[orderName];
                    }
                }
            });
            localStorage.setItem("preparedOrders", JSON.stringify(newPreparedOrders));
            console.log("Dispatch.jsx: Updated preparedOrders after bulk dispatch:", JSON.stringify(newPreparedOrders, null, 2));
            return newPreparedOrders;
        });
        setSelectedItems([]);
    };

    const formatIngredients = (ingredients) => {
        if (!ingredients || ingredients.length === 0) return "";
        return ingredients
            .map((ing) => `${ing.name} - ${ing.quantity} ${ing.unit}`)
            .join(", ");
    };

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="container mt-5">
            <div className="card shadow-lg">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <button className="btn btn-light btn-sm" onClick={handleBack}>
                        <i className="bi bi-arrow-left"></i> Back
                    </button>
                    <h3 className="mb-0">Dispatch Dashboard</h3>
                    <button className="btn btn-light btn-sm" onClick={fetchPreparedOrders}>
                        <i className="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2 text-muted">Loading prepared orders...</p>
                        </div>
                    ) : error ? (
                        <div className="alert alert-danger text-center" role="alert">
                            {error}
                        </div>
                    ) : filteredPreparedOrders.length === 0 ? (
                        <div className="alert alert-info text-center" role="alert">
                            No prepared orders match the entered POS Invoice ID.
                        </div>
                    ) : (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0">Prepared Orders ({selectedItems.length} item(s) selected)</h5>
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={handleDispatchSelected}
                                    disabled={selectedItems.length === 0}
                                >
                                    Dispatch Selected
                                </button>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="searchInvoiceId" className="form-label fw-bold" style={{ color: "#3498db" }}>
                                    Filter by POS Invoice ID
                                </label>
                                <input
                                    type="text"
                                    id="searchInvoiceId"
                                    className="form-control"
                                    placeholder="Enter POS Invoice ID (e.g., POS-12345)"
                                    value={searchInvoiceId}
                                    onChange={(e) => setSearchInvoiceId(e.target.value)}
                                    style={{
                                        borderColor: "#007bff",
                                        backgroundColor: "#ffffff",
                                        color: "#333",
                                        boxShadow: "0 2px 4px rgba(0, 123, 255, 0.1)",
                                        transition: "all 0.3s ease",
                                    }}
                                    onMouseEnter={(e) => (e.target.style.boxShadow = "0 4px 8px rgba(0, 123, 255, 0.2)")}
                                    onMouseLeave={(e) => (e.target.style.boxShadow = "0 2px 4px rgba(0, 123, 255, 0.1)")}
                                />
                            </div>
                            <div className="accordion" id="preparedOrdersAccordion">
                                {filteredPreparedOrders.map((order, index) => {
                                    const allItemsSelected = order.items.every((item) =>
                                        selectedItems.some(
                                            (selected) => selected.orderName === order.orderName && selected.itemId === item.id
                                        )
                                    );
                                    return (
                                        <div key={order.orderName} className="accordion-item mb-3" style={{ border: "1px solid #3498db", borderRadius: "8px" }}>
                                            <h2 className="accordion-header" id={`heading-${order.orderName}`}>
                                                <button
                                                    className="accordion-button"
                                                    type="button"
                                                    data-bs-toggle="collapse"
                                                    data-bs-target={`#collapse-${order.orderName}`}
                                                    aria-expanded={index === 0 ? "true" : "false"}
                                                    aria-controls={`collapse-${order.orderName}`}
                                                    style={{ backgroundColor: "#007bff", color: "#ffffff", fontWeight: "600" }}
                                                >
                                                    (Table: {order.tableNumber || "N/A"}, Chairs: {order.chairCount || 0}, Delivery: {order.deliveryType})
                                                </button>
                                            </h2>
                                            <div
                                                id={`collapse-${order.orderName}`}
                                                className={`accordion-collapse collapse ${index === 0 ? "show" : ""}`}
                                                aria-labelledby={`heading-${order.orderName}`}
                                                data-bs-parent="#preparedOrdersAccordion"
                                            >
                                                <div className="accordion-body p-0">
                                                    <div className="table-responsive">
                                                        <table className="table table-bordered table-striped mb-0">
                                                            <thead className="table-dark">
                                                                <tr>
                                                                    <th>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={allItemsSelected}
                                                                            onChange={(e) => handleSelectAll(order, e.target.checked)}
                                                                        />
                                                                    </th>
                                                                    <th>Item</th>
                                                                    <th>Variants</th>
                                                                    <th>Kitchen</th>
                                                                    <th>Quantity</th>
                                                                    <th>Type</th>
                                                                    <th>Prepared Time</th>
                                                                    <th>Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {order.items.map((item) => (
                                                                    <tr key={item.id}>
                                                                        <td>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selectedItems.some(
                                                                                    (selected) =>
                                                                                        selected.orderName === order.orderName &&
                                                                                        selected.itemId === item.id
                                                                                )}
                                                                                onChange={() => handleSelectItem(order.orderName, item.id)}
                                                                            />
                                                                        </td>
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
                                                                            {item.ingredients?.length > 0 && (
                                                                                <p
                                                                                    style={{
                                                                                        fontSize: "12px",
                                                                                        color: "#666",
                                                                                        marginTop: "5px",
                                                                                        marginBottom: "0",
                                                                                    }}
                                                                                >
                                                                                    <strong>Ingredients:</strong> {formatIngredients(item.ingredients)}
                                                                                </p>
                                                                            )}
                                                                        </td>
                                                                        <td>{item.custom_variants || "None"}</td>
                                                                        <td>{item.kitchen}</td>
                                                                        <td>{item.quantity}</td>
                                                                        <td>{item.type}</td>
                                                                        <td>{item.preparedTime}</td>
                                                                        <td>
                                                                            <button
                                                                                className="btn btn-primary btn-sm"
                                                                                onClick={() => handleDispatchItem(order.orderName, item.id)}
                                                                            >
                                                                                Dispatch
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dispatch;