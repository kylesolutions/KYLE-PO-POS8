import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Kitchen.css";

function Kitchen() {
    const navigate = useNavigate();
    const location = useLocation();
    const [kitchenNotes, setKitchenNotes] = useState([]);
    const [preparedItems, setPreparedItems] = useState([]);
    const [selectedKitchen, setSelectedKitchen] = useState("All");
    const [allKitchens, setAllKitchens] = useState([]);
    const [showStatusPopup, setShowStatusPopup] = useState(false);
    const [preparedOrders, setPreparedOrders] = useState({});
    const [searchInvoiceId, setSearchInvoiceId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [bulkUpdating, setBulkUpdating] = useState(false);

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

            if (data.message?.status !== "success") {
                throw new Error(data.message?.message || data.exception || "Invalid response from server");
            }

            if (!data.message?.data || !Array.isArray(data.message.data) || data.message.data.length === 0) {
                setKitchenNotes([]);
                setAllKitchens([]);
                setLoading(false);
                return;
            }

            const storedPreparedOrders = JSON.parse(localStorage.getItem("preparedOrders")) || {};

            const formattedNotes = data.message.data.map((note) => {
                const chairCount = parseInt(note.number_of_chair) || 0;
                
                return {
                    name: note.name,
                    pos_invoice_id: note.pos_invoice_id,
                    customer: note.customer_name || "Unknown",
                    custom_table_number: note.table_number || "N/A",
                    custom_delivery_type: note.delivery_type || "DINE IN",
                    custom_chair_count: chairCount,
                    posting_date: note.order_time,
                    cartItems: note.items
                        .filter(item => item.status !== "Prepared" && item.status !== "Dispatched")
                        .map((item) => {
                            const itemId = `${item.kitchen || 'Unknown'}-${item.name}`;
                            
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
                                status: item.status || "Prepare",
                                addonCounts: {},
                                selectedCombos: [],
                                type: "main",
                                ingredients: item.ingredients?.map((ing) => ({
                                    name: ing.name || ing.ingredients_name || "Unknown Ingredient",
                                    quantity: parseFloat(ing.quantity) || 100,
                                    unit: ing.unit || "g",
                                })) || [],
                            };
                        }),
                };
            });

            const kitchensFromData = [
                ...new Set(
                    formattedNotes.flatMap((order) =>
                        order.cartItems.map((item) => item.kitchen || "Unknown")
                    )
                ),
            ];
            setAllKitchens(kitchensFromData);

            if (location.state?.order) {
                const passedOrder = {
                    ...location.state.order,
                    custom_chair_count: parseInt(location.state.order.custom_chair_count) || 0,
                    cartItems: location.state.order.cartItems
                        .filter(item => item.status !== "Prepared" && item.status !== "Dispatched")
                        .map(item => {
                            const itemId = `${item.kitchen || 'Unknown'}-${item.name}`;
                            return {
                                id: itemId,
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
                                ingredients: item.ingredients?.map((ing) => ({
                                    name: ing.name || ing.ingredients_name || "Unknown Ingredient",
                                    quantity: parseFloat(ing.quantity) || 100,
                                    unit: ing.unit || "g",
                                })) || [],
                            };
                        }),
                };
                setKitchenNotes([passedOrder]);
                setSelectedKitchen("All");
            } else {
                setKitchenNotes(formattedNotes);
                setSelectedKitchen("All");
            }

            const storedPreparedItems = JSON.parse(localStorage.getItem("preparedItems")) || [];
            setPreparedItems(storedPreparedItems);
            setPreparedOrders(storedPreparedOrders);
        } catch (error) {
            const errorMessage = error.message || "An unexpected error occurred";
            console.error("Kitchen.jsx: Error fetching Kitchen Notes:", error);
            setError(`Failed to load kitchen notes: ${errorMessage}. Please try again or contact support.`);
            setKitchenNotes([]);
            setAllKitchens([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKitchenNotes();
        const intervalId = setInterval(fetchKitchenNotes, 30000);
        return () => clearInterval(intervalId);
    }, [location]);

    const getFilteredItems = (kitchen) => {
        const filteredItemsMap = new Map();
        kitchenNotes.forEach((order) => {
            order.cartItems.forEach((item) => {
                if ((kitchen === "All" || item.kitchen === kitchen) && item.status !== "Prepared" && item.status !== "Dispatched") {
                    filteredItemsMap.set(item.id, {
                        ...item,
                        pos_invoice_id: order.pos_invoice_id,
                        tableNumber: order.custom_table_number,
                        deliveryType: order.custom_delivery_type,
                        chairCount: order.custom_chair_count,
                    });
                }
            });
        });
        return Array.from(filteredItemsMap.values());
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const item = getFilteredItems("All").find((i) => i.id === id);
            if (!item) throw new Error("Item not found");

            const statusResponse = await fetch(
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

            const statusResult = await statusResponse.json();
            if (statusResult.message?.status !== "success") {
                throw new Error(statusResult.message?.message || statusResult.exception || "Failed to update status");
            }

            setKitchenNotes((prev) =>
                prev.map((order) => ({
                    ...order,
                    cartItems: order.cartItems.map((cartItem) => {
                        if (cartItem.id === id) {
                            return { ...cartItem, status: newStatus };
                        }
                        return cartItem;
                    }),
                }))
            );

            if (newStatus === "Prepared") {
                const preparedTime = new Date().toLocaleString();
                const orderName = item.pos_invoice_id || item.id.split("-")[0];
                const preparedItem = {
                    ...item,
                    preparedTime,
                    status: "Prepared",
                };

                setPreparedOrders((prev) => {
                    const existingOrder = prev[orderName] || {
                        customerName: item.customer || "Unknown",
                        tableNumber: item.tableNumber || "N/A",
                        deliveryType: item.deliveryType || "DINE IN",
                        chairCount: item.chairCount || 0,
                        pos_invoice_id: orderName,
                        items: [],
                    };
                    if (!existingOrder.items.some((i) => i.id === item.id)) {
                        existingOrder.items.push(preparedItem);
                    }
                    const newPreparedOrders = { ...prev, [orderName]: existingOrder };
                    localStorage.setItem("preparedOrders", JSON.stringify(newPreparedOrders));
                    return newPreparedOrders;
                });

                setKitchenNotes((prev) =>
                    prev.map((order) => ({
                        ...order,
                        cartItems: order.cartItems.filter((cartItem) => cartItem.id !== id || (cartItem.status !== "Prepared" && cartItem.status !== "Dispatched")),
                    }))
                );
                setPreparedItems((prev) => [...new Set([...prev, id])]);
            }

            localStorage.setItem("preparedItems", JSON.stringify(preparedItems));
        } catch (error) {
            console.error("Kitchen.jsx: Error updating status:", error);
            alert(`Unable to update item status: ${error.message || "Please try again."}`);
        }
    };

    const handleBulkStatusChange = async () => {
        if (selectedItems.length === 0) {
            alert("Please select at least one item to mark as Prepared.");
            return;
        }

        setBulkUpdating(true);
        try {
            for (const id of selectedItems) {
                const item = getFilteredItems("All").find((i) => i.id === id);
                if (!item) {
                    console.warn(`Kitchen.jsx: Item with ID ${id} not found during bulk update`);
                    continue;
                }

                const statusResponse = await fetch(
                    "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.update_kitchen_note_status",
                    {
                        method: "POST",
                        headers: {
                            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            item_name: item.backendId,
                            status: "Prepared",
                        }),
                    }
                );

                const statusResult = await statusResponse.json();
                if (statusResult.message?.status !== "success") {
                    throw new Error(statusResult.message?.message || statusResult.exception || `Failed to update status for ${item.name}`);
                }

                const preparedTime = new Date().toLocaleString();
                const orderName = item.pos_invoice_id || item.id.split("-")[0];
                const preparedItem = {
                    ...item,
                    preparedTime,
                    status: "Prepared",
                };

                setPreparedOrders((prev) => {
                    const existingOrder = prev[orderName] || {
                        customerName: item.customer || "Unknown",
                        tableNumber: item.tableNumber || "N/A",
                        deliveryType: item.deliveryType || "DINE IN",
                        chairCount: item.chairCount || 0,
                        pos_invoice_id: orderName,
                        items: [],
                    };
                    if (!existingOrder.items.some((i) => i.id === item.id)) {
                        existingOrder.items.push(preparedItem);
                    }
                    const newPreparedOrders = { ...prev, [orderName]: existingOrder };
                    localStorage.setItem("preparedOrders", JSON.stringify(newPreparedOrders));
                    return newPreparedOrders;
                });

                setKitchenNotes((prev) =>
                    prev.map((order) => ({
                        ...order,
                        cartItems: order.cartItems
                            .map((cartItem) => {
                                if (cartItem.id === id) {
                                    return { ...cartItem, status: "Prepared" };
                                }
                                return cartItem;
                            })
                            .filter((cartItem) => cartItem.id !== id || (cartItem.status !== "Prepared" && cartItem.status !== "Dispatched")),
                    }))
                );

                setPreparedItems((prev) => [...new Set([...prev, id])]);
            }

            localStorage.setItem("preparedItems", JSON.stringify(preparedItems));
            setSelectedItems([]);
            alert(`${selectedItems.length} item(s) marked as Prepared successfully!`);
        } catch (error) {
            console.error("Kitchen.jsx: Error during bulk status update:", error);
            alert(`Failed to mark items as Prepared: ${error.message || "Please try again."}`);
        } finally {
            setBulkUpdating(false);
        }
    };

    const handleSelectItem = (id) => {
        setSelectedItems((prev) =>
            prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (kitchen) => {
        const tableItems = getFilteredItems(kitchen);
        const tableItemsIds = tableItems.map((item) => item.id);
        const numSelectedInTable = tableItems.filter((item) => selectedItems.includes(item.id)).length;

        if (numSelectedInTable === tableItems.length) {
            setSelectedItems((prev) => prev.filter((id) => !tableItemsIds.includes(id)));
        } else {
            setSelectedItems((prev) => [...new Set([...prev, ...tableItemsIds.filter((id) => !prev.includes(id))])]);
        }
    };

    const handleRefresh = () => {
        fetchKitchenNotes();
    };

    const formatIngredients = (ingredients) => {
        if (!ingredients || ingredients.length === 0) return "";
        return ingredients
            .map((ing) => `${ing.name} - ${ing.quantity} ${ing.unit}`)
            .join(", ");
    };

    const getStatusClass = (status) => {
        switch (status || "Prepare") {
            case "Prepare":
                return "status-prepare";
            case "Preparing":
                return "status-preparing";
            case "Prepared":
                return "status-prepared";
            default:
                return "status-default";
        }
    };

    const getStatusIcon = (status) => {
        switch (status || "Prepare") {
            case "Prepare":
                return "⏸️";
            case "Preparing":
                return "⏱️";
            case "Prepared":
                return "✅";
            default:
                return "❓";
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleDeleteItem = (orderName, itemId) => {
        setPreparedOrders((prev) => {
            const updatedOrder = { ...prev[orderName] };
            updatedOrder.items = updatedOrder.items.filter((item) => item.id !== itemId);
            const newPreparedOrders = { ...prev, [orderName]: updatedOrder };
            if (updatedOrder.items.length === 0) {
                delete newPreparedOrders[orderName];
            }
            localStorage.setItem("preparedOrders", JSON.stringify(newPreparedOrders));
            return newPreparedOrders;
        });
    };

    const filteredPreparedOrders = Object.entries(preparedOrders)
        .filter(([orderName]) =>
            orderName.toLowerCase().includes(searchInvoiceId.toLowerCase())
        )
        .map(([orderName, order]) => ({
            orderName,
            ...order,
        }));

    const renderKitchenSection = (kitchen) => {
        const items = getFilteredItems(kitchen);
        const numSelectedInTable = items.filter((item) => selectedItems.includes(item.id)).length;
        
        return (
            <div className="kitchen-section" key={kitchen}>
                <div className="kitchen-header">
                    <div className="kitchen-title">
                        <h3>🍳 {kitchen}</h3>
                        <span className="item-count">{items.length} items</span>
                    </div>
                    {items.length > 0 && (
                        <div className="select-all-container">
                            <label className="select-all-label">
                                <input
                                    type="checkbox"
                                    checked={numSelectedInTable === items.length && items.length > 0}
                                    onChange={() => handleSelectAll(kitchen)}
                                    className="select-all-checkbox"
                                />
                                <span className="checkmark"></span>
                                Select All ({numSelectedInTable}/{items.length})
                            </label>
                        </div>
                    )}
                </div>
                
                <div className="items-container">
                    {items.length === 0 ? (
                        <div className="no-items">
                            <div className="no-items-icon">🎉</div>
                            <h4>All Done!</h4>
                            <p>No pending orders for {kitchen}</p>
                        </div>
                    ) : (
                        <div className="items-grid">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className={`item-card ${getStatusClass(item.status)} ${
                                        selectedItems.includes(item.id) ? 'selected' : ''
                                    }`}
                                >
                                    <div className="item-header">
                                        <label className="item-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(item.id)}
                                                onChange={() => handleSelectItem(item.id)}
                                                className="item-checkbox"
                                            />
                                            <span className="checkmark"></span>
                                        </label>
                                        <div className="status-badge">
                                            <span className="status-icon">{getStatusIcon(item.status)}</span>
                                            <span className="status-text">{item.status}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="item-content">
                                        <h4 className="item-name">{item.name}</h4>
                                        
                                        <div className="item-details">
                                            <div className="detail-row">
                                                <span className="detail-label">Quantity:</span>
                                                <span className="detail-value">{item.quantity}</span>
                                            </div>
                                            {item.custom_variants && (
                                                <div className="detail-row">
                                                    <span className="detail-label">Variants:</span>
                                                    <span className="detail-value">{item.custom_variants}</span>
                                                </div>
                                            )}
                                        </div>

                                        {item.custom_customer_description && (
                                            <div className="customer-note">
                                                <span className="note-icon">📝</span>
                                                <strong>Note:</strong> {item.custom_customer_description}
                                            </div>
                                        )}

                                        {item.ingredients?.length > 0 && (
                                            <div className="ingredients-note">
                                                <span className="ingredients-icon">🧄</span>
                                                <strong>Ingredients:</strong> {formatIngredients(item.ingredients)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="item-actions">
                                        <select
                                            value={item.status || "Prepare"}
                                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                            className="status-select"
                                        >
                                            <option value="Prepare">Prepare</option>
                                            <option value="Preparing">Preparing</option>
                                            <option value="Prepared">Prepared</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="kitchen-dashboard">
            <div className="dashboard-header">
                <div className="header-left">
                    <button className="back-btn" onClick={handleBack}>
                        ← Back
                    </button>
                    <h1 className="dashboard-title">🍳 Kitchen Dashboard</h1>
                </div>
                <div className="header-right">
                    <button className="action-btn info-btn" onClick={() => setShowStatusPopup(true)}>
                        📊 Prepared Items
                    </button>
                    <button className="action-btn refresh-btn" onClick={handleRefresh}>
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading kitchen orders...</p>
                </div>
            ) : error ? (
                <div className="error-container">
                    <div className="error-icon">⚠️</div>
                    <h3>Something went wrong</h3>
                    <p>{error}</p>
                    <button className="retry-btn" onClick={handleRefresh}>Try Again</button>
                </div>
            ) : allKitchens.length === 0 && getFilteredItems("All").length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🎉</div>
                    <h2>All Caught Up!</h2>
                    <p>No active kitchen orders found. Great work!</p>
                </div>
            ) : (
                <>
                    <div className="controls-section">
                        <div className="filter-container">
                            <label className="filter-label">Filter by Kitchen:</label>
                            <select
                                value={selectedKitchen}
                                onChange={(e) => setSelectedKitchen(e.target.value)}
                                className="kitchen-filter"
                            >
                                <option value="All">🏪 All Kitchens</option>
                                {allKitchens.map((kitchen) => (
                                    <option key={kitchen} value={kitchen}>
                                        🍳 {kitchen}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <button
                            className={`bulk-action-btn ${selectedItems.length === 0 ? 'disabled' : ''}`}
                            onClick={handleBulkStatusChange}
                            disabled={selectedItems.length === 0 || bulkUpdating}
                        >
                            {bulkUpdating ? (
                                <>
                                    <span className="spinner"></span>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    ✅ Mark Selected as Prepared ({selectedItems.length})
                                </>
                            )}
                        </button>
                    </div>

                    <div className="kitchens-container">
                        {selectedKitchen === "All" 
                            ? allKitchens.map(kitchen => renderKitchenSection(kitchen))
                            : renderKitchenSection(selectedKitchen)
                        }
                    </div>
                </>
            )}

            {showStatusPopup && (
                <div className="modal-overlay" onClick={() => setShowStatusPopup(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📊 Prepared Items Status</h2>
                            <button 
                                className="close-btn" 
                                onClick={() => setShowStatusPopup(false)}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="search-container">
                                <input
                                    type="text"
                                    placeholder="🔍 Search by POS Invoice ID..."
                                    value={searchInvoiceId}
                                    onChange={(e) => setSearchInvoiceId(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                            
                            {filteredPreparedOrders.length === 0 ? (
                                <div className="no-results">
                                    <div className="no-results-icon">📋</div>
                                    <p>No prepared orders match your search.</p>
                                </div>
                            ) : (
                                <div className="prepared-orders">
                                    {filteredPreparedOrders.map((order) => (
                                        <div key={order.orderName} className="prepared-order">
                                            <div className="order-header">
                                                <h3>Order: {order.orderName}</h3>
                                                <div className="order-info">
                                                    <span>🪑 Table: {order.tableNumber}</span>
                                                    <span>👥 Chairs: {order.chairCount}</span>
                                                    <span>🚚 {order.deliveryType}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="order-items">
                                                {order.items.map((item) => (
                                                    <div key={item.id} className="prepared-item">
                                                        <div className="prepared-item-info">
                                                            <h4>{item.name}</h4>
                                                            <div className="item-meta">
                                                                <span>Qty: {item.quantity}</span>
                                                                <span>Kitchen: {item.kitchen}</span>
                                                                <span>Prepared: {item.preparedTime}</span>
                                                            </div>
                                                            {item.custom_customer_description && (
                                                                <div className="item-note">
                                                                    📝 {item.custom_customer_description}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            className="delete-btn"
                                                            onClick={() => handleDeleteItem(order.orderName, item.id)}
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Kitchen;