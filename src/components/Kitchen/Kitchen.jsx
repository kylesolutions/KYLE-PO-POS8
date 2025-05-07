import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Kitchen() {
    const navigate = useNavigate();
    const location = useLocation();
    const [kitchenNotes, setKitchenNotes] = useState([]);
    const [preparedItems, setPreparedItems] = useState([]);
    const [selectedKitchen, setSelectedKitchen] = useState(null);
    const [allKitchens, setAllKitchens] = useState([]);
    const [showStatusPopup, setShowStatusPopup] = useState(false);
    const [preparedOrders, setPreparedOrders] = useState({});
    const [searchInvoiceId, setSearchInvoiceId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]); // Track selected item IDs
    const [bulkUpdating, setBulkUpdating] = useState(false); // Track bulk update state

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
            console.log("Kitchen.jsx: Raw response from get_kitchen_notes:", JSON.stringify(data, null, 2));

            if (data.message?.status !== "success") {
                throw new Error(data.message?.message || data.exception || "Invalid response from server");
            }

            if (!data.message?.data || !Array.isArray(data.message.data) || data.message.data.length === 0) {
                console.warn("Kitchen.jsx: No kitchen notes found in response:", data);
                setKitchenNotes([]);
                setAllKitchens([]);
                setLoading(false);
                return;
            }

            const storedPreparedOrders = JSON.parse(localStorage.getItem("preparedOrders")) || {};

            const formattedNotes = data.message.data.map((note) => {
                const chairCount = parseInt(note.number_of_chair) || 0;
                console.log(`Kitchen.jsx: Processing note ${note.pos_invoice_id} - number_of_chair: ${note.number_of_chair}, parsed: ${chairCount}`);
                if (note.delivery_type === "DINE IN" && chairCount === 0) {
                    console.warn(`Kitchen.jsx: Warning: chairCount is 0 for DINE IN order ${note.pos_invoice_id}`);
                }

                return {
                    name: note.name,
                    pos_invoice_id: note.pos_invoice_id,
                    customer: note.customer_name || "Unknown",
                    custom_table_number: note.table_number || "N/A",
                    custom_delivery_type: note.delivery_type || "DINE IN",
                    custom_chair_count: chairCount,
                    posting_date: note.order_time,
                    cartItems: note.items.map((item) => {
                        const itemId = item.name; // Use backend item.name as unique ID
                        const isPrepared = Object.values(storedPreparedOrders).some(o =>
                            o.items.some(i => i.id === itemId && i.status === "Prepared")
                        );
                        console.log(`Kitchen.jsx: Item ${item.item_name} (ID: ${itemId}) - isPrepared: ${isPrepared}, backend status: ${item.status}`);
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
                            status: item.status || "Prepare", // Trust backend status, override only if prepared
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

            // Extract all kitchens from the data
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
                    cartItems: location.state.order.cartItems.map(item => ({
                        id: item.name, // Use item.name for consistency
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
                    })),
                };
                console.log(`Kitchen.jsx: Passed order - custom_chair_count: ${passedOrder.custom_chair_count}`);
                if (passedOrder.custom_delivery_type === "DINE IN" && passedOrder.custom_chair_count === 0) {
                    console.warn(`Kitchen.jsx: Warning: chairCount is 0 for passed DINE IN order ${passedOrder.pos_invoice_id}`);
                }
                setKitchenNotes([passedOrder]);
                setSelectedKitchen(passedOrder.cartItems[0]?.kitchen || kitchensFromData[0] || "Unknown");
            } else {
                setKitchenNotes(formattedNotes);
            }

            const storedPreparedItems = JSON.parse(localStorage.getItem("preparedItems")) || [];
            setPreparedItems(storedPreparedItems);
            setPreparedOrders(storedPreparedOrders);
            console.log("Kitchen.jsx: Updated kitchenNotes:", JSON.stringify(formattedNotes, null, 2));
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

    useEffect(() => {
        if (allKitchens.length > 0 && !selectedKitchen && !location.state?.order) {
            const kitchenWithItems = allKitchens.find((kitchen) =>
                kitchenNotes.some((order) =>
                    order.cartItems.some((item) => item.kitchen === kitchen && item.status !== "Prepared")
                )
            );
            setSelectedKitchen(kitchenWithItems || allKitchens[0]);
        }
    }, [allKitchens, kitchenNotes, selectedKitchen, location.state]);

    const filteredItemsMap = new Map();
    kitchenNotes.forEach((order) => {
        order.cartItems.forEach((item) => {
            if (item.kitchen === selectedKitchen && item.status !== "Prepared") {
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
    const filteredItems = Array.from(filteredItemsMap.values());
    console.log("Kitchen.jsx: Filtered items for", selectedKitchen, ":", JSON.stringify(filteredItems, null, 2));

    const handleStatusChange = async (id, newStatus) => {
        try {
            const item = filteredItems.find((i) => i.id === id);
            if (!item) throw new Error("Item not found");

            console.log("Kitchen.jsx: Changing status for item", item.name, "to", newStatus);

            // Update backend status
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
            console.log("Kitchen.jsx: Status update response:", JSON.stringify(statusResult, null, 2));
            if (statusResult.message?.status !== "success") {
                throw new Error(statusResult.message?.message || statusResult.exception || "Failed to update status");
            }

            // Update local state for all statuses
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

            // If status is "Prepared", add to preparedOrders and remove from frontend display
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
                    console.log("Kitchen.jsx: Updated preparedOrders:", JSON.stringify(newPreparedOrders, null, 2));
                    return newPreparedOrders;
                });

                // Remove prepared item from kitchenNotes
                setKitchenNotes((prev) =>
                    prev.map((order) => ({
                        ...order,
                        cartItems: order.cartItems.filter((cartItem) => cartItem.id !== id || cartItem.status !== "Prepared"),
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
                const item = filteredItems.find((i) => i.id === id);
                if (!item) {
                    console.warn(`Kitchen.jsx: Item with ID ${id} not found during bulk update`);
                    continue;
                }

                console.log("Kitchen.jsx: Bulk updating item", item.name, "to Prepared");

                // Update backend status
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
                console.log("Kitchen.jsx: Bulk status update response for", item.name, ":", JSON.stringify(statusResult, null, 2));
                if (statusResult.message?.status !== "success") {
                    throw new Error(statusResult.message?.message || statusResult.exception || `Failed to update status for ${item.name}`);
                }

                // Update local state
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
                    console.log("Kitchen.jsx: Updated preparedOrders (bulk):", JSON.stringify(newPreparedOrders, null, 2));
                    return newPreparedOrders;
                });

                setKitchenNotes((prev) =>
                    prev.map((order) => ({
                        ...order,
                        cartItems: order.cartItems.map((cartItem) => {
                            if (cartItem.id === id) {
                                return { ...cartItem, status: "Prepared" };
                            }
                            return cartItem;
                        }).filter((cartItem) => cartItem.id !== id || cartItem.status !== "Prepared"),
                    }))
                );

                setPreparedItems((prev) => [...new Set([...prev, id])]);
            }

            localStorage.setItem("preparedItems", JSON.stringify(preparedItems));
            setSelectedItems([]); // Clear selection
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

    const handleSelectAll = () => {
        if (selectedItems.length === filteredItems.length) {
            setSelectedItems([]); // Deselect all
        } else {
            setSelectedItems(filteredItems.map((item) => item.id)); // Select all
        }
    };

    const handleRefresh = () => {
        console.log("Kitchen.jsx: Manual refresh triggered");
        fetchKitchenNotes();
    };

    const formatIngredients = (ingredients) => {
        if (!ingredients || ingredients.length === 0) return "";
        return ingredients
            .map((ing) => `${ing.name} - ${ing.quantity} ${ing.unit}`)
            .join(", ");
    };

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

    const handleDeleteItem = (orderName, itemId) => {
        setPreparedOrders((prev) => {
            const updatedOrder = { ...prev[orderName] };
            updatedOrder.items = updatedOrder.items.filter((item) => item.id !== itemId);
            const newPreparedOrders = { ...prev, [orderName]: updatedOrder };
            if (updatedOrder.items.length === 0) {
                delete newPreparedOrders[orderName];
            }
            localStorage.setItem("preparedOrders", JSON.stringify(newPreparedOrders));
            console.log("Kitchen.jsx: Updated preparedOrders after delete:", JSON.stringify(newPreparedOrders, null, 2));
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

    return (
        <div className="container mt-5">
            <div className="card shadow-lg">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <button className="btn btn-light btn-sm" onClick={handleBack}>
                        <i className="bi bi-arrow-left"></i> Back
                    </button>
                    <h3 className="mb-0">Kitchen Dashboard</h3>
                    <div>
                        <button className="btn btn-info btn-sm me-2" onClick={() => setShowStatusPopup(true)}>
                            <i className="bi bi-info-circle"></i> Status
                        </button>
                        <button className="btn btn-light btn-sm" onClick={handleRefresh}>
                            <i className="bi bi-arrow-clockwise"></i> Refresh
                        </button>
                    </div>
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
                    ) : allKitchens.length === 0 && filteredItems.length === 0 ? (
                        <div className="alert alert-info text-center" role="alert">
                            No active kitchen orders found for any kitchen.
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <h5 className="fw-bold">Select Kitchen:</h5>
                                <div className="btn-group flex-wrap gap-2">
                                    {allKitchens.map((kitchen) => (
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

                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0">Current Orders - {selectedKitchen || "Select a Kitchen"}</h5>
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={handleBulkStatusChange}
                                    disabled={selectedItems.length === 0 || bulkUpdating}
                                >
                                    {bulkUpdating ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Updating...
                                        </>
                                    ) : (
                                        `Mark Selected as Prepared (${selectedItems.length})`
                                    )}
                                </button>
                            </div>

                            {filteredItems.length === 0 ? (
                                <div className="alert alert-info text-center" role="alert">
                                    No active orders for {selectedKitchen || "selected kitchen"}.
                                </div>
                            ) : (
                                <div className="table-responsive text-center">
                                    <table className="table table-bordered table-hover">
                                        <thead className="table-dark">
                                            <tr>
                                                <th>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                                                        onChange={handleSelectAll}
                                                    />
                                                </th>
                                                <th>Invoice</th>
                                                <th>Table</th>
                                                <th>Chairs</th>
                                                <th>Delivery Type</th>
                                                <th>Item</th>
                                                <th>Variants</th>
                                                <th>Quantity</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredItems.map((item) => (
                                                <tr key={item.id} style={getRowStyle(item.status)}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedItems.includes(item.id)}
                                                            onChange={() => handleSelectItem(item.id)}
                                                        />
                                                    </td>
                                                    <td>{item.pos_invoice_id || "Unknown"}</td>
                                                    <td>{item.tableNumber || "N/A"}</td>
                                                    <td>{item.deliveryType === "DINE IN" ? item.chairCount : "N/A"}</td>
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
                                                    <td>{item.quantity}</td>
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
                                <h5 className="modal-title">Prepared Items Status</h5>
                                <button
                                    type="button"
                                    className="btn-close bg-white"
                                    onClick={() => setShowStatusPopup(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label htmlFor="searchInvoiceId" className="form-label fw-bold">
                                        Filter by POS Invoice ID
                                    </label>
                                    <input
                                        type="text"
                                        id="searchInvoiceId"
                                        className="form-control"
                                        placeholder="Enter POS Invoice ID (e.g., POS-12345)"
                                        value={searchInvoiceId}
                                        onChange={(e) => setSearchInvoiceId(e.target.value)}
                                    />
                                </div>
                                {filteredPreparedOrders.length === 0 ? (
                                    <p className="text-muted">No prepared orders match the entered POS Invoice ID.</p>
                                ) : (
                                    <div className="accordion" id="preparedOrdersAccordion">
                                        {filteredPreparedOrders.map((order, index) => (
                                            <div key={order.orderName} className="accordion-item mb-3">
                                                <h2 className="accordion-header" id={`heading-${order.orderName}`}>
                                                    <button
                                                        className="accordion-button"
                                                        type="button"
                                                        data-bs-toggle="collapse"
                                                        data-bs-target={`#collapse-${order.orderName}`}
                                                        aria-expanded={index === 0 ? "true" : "false"}
                                                        aria-controls={`collapse-${order.orderName}`}
                                                    >
                                                        Order: {order.orderName} (Table: {order.tableNumber || "N/A"}, Chairs: {order.chairCount || 0}, Delivery: {order.deliveryType})
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
                                                                                    className="btn btn-danger btn-sm"
                                                                                    onClick={() => handleDeleteItem(order.orderName, item.id)}
                                                                                >
                                                                                    Delete
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
                                        ))}
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