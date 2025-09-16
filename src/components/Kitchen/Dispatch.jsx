import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

function Dispatch() {
  const navigate = useNavigate();
  const [preparedOrders, setPreparedOrders] = useState({});
  const [searchInvoiceId, setSearchInvoiceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [dispatchingItems, setDispatchingItems] = useState({});
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [selectedDeliveryBoys, setSelectedDeliveryBoys] = useState({});
  const [secretCodes, setSecretCodes] = useState({}); // New state for secret codes
  const [verifiedStates, setVerifiedStates] = useState({}); // New state for verification status

  const fetchPreparedOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_kitchen_notes",
        {
          method: "POST",
          headers: {
            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch prepared orders: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Dispatch.jsx: Raw response from get_kitchen_notes:", JSON.stringify(data, null, 2));

      if (data.message?.status !== "success") {
        throw new Error(data.message?.message || data.exception || "Invalid response from server");
      }

      if (!data.message?.data || !Array.isArray(data.message.data)) {
        console.warn("Dispatch.jsx: No prepared orders found in response:", data);
        setPreparedOrders({});
        return;
      }

      const formattedOrders = data.message.data.reduce((acc, order) => {
        const chairCount = parseInt(order.number_of_chair) || 0;
        const preparedItems = order.items.filter(
          (item) => item.status === "Prepared" && item.status !== "Dispatched"
        );
        if (preparedItems.length === 0) return acc;

        acc[order.pos_invoice_id] = {
          customerName: order.customer_name || "Unknown",
          tableNumber: order.table_number || "N/A",
          deliveryType: order.delivery_type || "DINE IN",
          chairCount,
          pos_invoice_id: order.pos_invoice_id,
          items: preparedItems.map((item) => ({
            id: item.name,
            backendId: item.name,
            item_code: item.item_name,
            name: item.item_name,
            custom_customer_description: item.customer_description || "",
            custom_variants: item.custom_variants || "",
            basePrice: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity, 10) || 1,
            selectedSize: "",
            selectedCustomVariant: item.custom_variants || "",
            kitchen: item.kitchen || "Unknown",
            status: item.status || "Prepared",
            addonCounts: {},
            selectedCombos: [],
            type: "main",
            preparedTime: new Date().toLocaleString(),
            ingredients: item.ingredients?.map((ing) => ({
              name: ing.name || ing.ingredients_name || "Unknown Ingredient",
              quantity: parseFloat(ing.quantity) || 100,
              unit: ing.unit || "g",
            })) || [],
          })),
        };
        return acc;
      }, {});
      setPreparedOrders(formattedOrders);
      console.log("Dispatch.jsx: Formatted preparedOrders:", JSON.stringify(formattedOrders, null, 2));
    } catch (error) {
      console.error("Dispatch.jsx: Error fetching prepared orders:", error.message, error);
      setError(`Failed to load prepared orders: ${error.message}. Please try again or contact support.`);
      setPreparedOrders({});
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeliveryBoys = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_available_delivery_boys",
        {
          method: "POST",
          headers: {
            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch delivery boys: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Dispatch.jsx: get_available_delivery Response:", JSON.stringify(data, null, 2));

      if (!data.message || data.message.status !== "Success") {
        throw new Error(data.message?.message || "Failed to retrieve delivery boys");
      }

      setDeliveryBoys(data.message.data || []);
    } catch (error) {
      console.error("Dispatch.jsx: Error fetching delivery boys:", error.message, error);
      setError(`Failed to load delivery boys: ${error.message}. Please try again.`);
    }
  }, []);

  const verifySecretCode = async (employeeName, secretCode) => {
    try {
      const response = await fetch(
        "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.verify_delivery_boy_code",
        {
          method: "POST",
          headers: {
            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_name: employeeName,
            secret_code: secretCode
          }),
        }
      );

      const result = await response.json();
      return result.message || result; // Adjust based on API response structure
    } catch (error) {
      console.error("Error verifying secret code:", error);
      return { status: "error", message: "Failed to verify code" };
    }
  };

  const handleVerify = useCallback(async (orderName) => {
    const employeeName = selectedDeliveryBoys[orderName];
    const code = secretCodes[orderName];
    
    if (!employeeName || !code) {
      alert("Please select delivery boy and enter code");
      return;
    }

    const result = await verifySecretCode(employeeName, code);
    
    if (result.status === "success") {
      setVerifiedStates(prev => ({ ...prev, [orderName]: true }));
      alert("Code verified successfully");
    } else {
      setVerifiedStates(prev => ({ ...prev, [orderName]: false }));
      alert(result.message || "The code is wrong");
    }
  }, [selectedDeliveryBoys, secretCodes]);

  const createHomeDeliveryOrder = useCallback(async (order, items, secretCode) => {
    try {
      const selectedDeliveryBoy = selectedDeliveryBoys[order.pos_invoice_id];
      if (!selectedDeliveryBoy) {
        throw new Error("No delivery boy selected for this order");
      }
      if (!secretCode) {
        throw new Error("Secret code is required for delivery boy verification");
      }

      const posInvoiceResponse = await fetch(
        `/api/resource/POS Invoice/${order.pos_invoice_id}?fields=["customer_name","customer_address","contact_mobile","items"]`,
        {
          method: "GET",
          headers: {
            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
            "Content-Type": "application/json",
          },
        }
      );

      if (!posInvoiceResponse.ok) {
        throw new Error(`Failed to fetch POS Invoice: ${posInvoiceResponse.status}`);
      }

      const posInvoiceData = await posInvoiceResponse.json();
      if (!posInvoiceData.data) {
        throw new Error("POS Invoice not found");
      }

      const payload = {
        invoice_id: order.pos_invoice_id,
        employee_name: selectedDeliveryBoy,
        secret_code: secretCode,
        customer_name: posInvoiceData.data.customer_name || "Unknown",
        customer_address: posInvoiceData.data.customer_address || "Unknown",
        customer_phone: posInvoiceData.data.contact_mobile || "Unknown",
        items: items.map((item) => {
          const itemPrice =
            posInvoiceData.data.items?.find((i) => i.item_name === item.item_code)?.rate ||
            item.basePrice;
          return {
            item_name: item.name,
            price: parseFloat(itemPrice) || 0,
            variants: item.custom_variants || "",
          };
        }),
      };

      const deliveryResponse = await fetch(
        "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.create_homedelivery_orders",
        {
          method: "POST",
          headers: {
            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await deliveryResponse.json();
      console.log("Dispatch.jsx: create_homedelivery_orders Response:", JSON.stringify(result, null, 2));
      if (result.message?.status !== "success") {
        throw new Error(result.message?.message || "Failed to create Home Delivery Order");
      }
      return true;
    } catch (error) {
      console.error("Dispatch.jsx: Error creating Home Delivery Order:", JSON.stringify(error, null, 2));
      throw error;
    }
  }, [selectedDeliveryBoys]);

  const updatePosInvoiceItemDispatchStatus = useCallback(async (posInvoiceId, itemName) => {
    try {
      const response = await fetch(
        "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.set_pos_invoice_item_dispatch_status",
        {
          method: "POST",
          headers: {
            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pos_invoice_id: posInvoiceId,
            item_name: itemName,
            is_dispatched: 1,
          }),
        }
      );

      const result = await response.json();
      console.log("Dispatch.jsx: set_pos_invoice_item_dispatch_status Response:", JSON.stringify(result, null, 2));
      if (result.message?.status !== "success") {
        throw new Error(result.message?.message || result.exception || "Failed to update POS Invoice item dispatch status");
      }
      return true;
    } catch (error) {
      console.error("Dispatch.jsx: Error updating POS Invoice item dispatch status:", error);
      return false;
    }
  }, []);

  const handleDispatchItem = useCallback(
    async (orderName, itemId) => {
      setDispatchingItems((prev) => ({ ...prev, [`${orderName}-${itemId}`]: true }));
      let dispatchError = null;
      try {
        const order = preparedOrders[orderName];
        if (!order) throw new Error("Order not found");
        const item = order?.items?.find((i) => i.id === itemId);
        if (!item) throw new Error("Item not found");

        const secretCode = secretCodes[orderName] || "";

        if (order.deliveryType === "DELIVERY") {
          const verifyResult = await verifySecretCode(selectedDeliveryBoys[orderName], secretCode);
          if (verifyResult.status !== "success") {
            alert(verifyResult.message || "The secret code is wrong. Item can't be dispatched.");
            return;
          }
        }

        const kitchenResponse = await fetch(
          "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.update_kitchen_note_status",
          {
            method: "POST",
            headers: {
              Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              item_name: item.backendId,
              status: "Dispatched",
            }),
          }
        );

        const kitchenResult = await kitchenResponse.json();
        console.log("Dispatch.jsx: Dispatch response (Kitchen Note):", JSON.stringify(kitchenResult, null, 2));
        if (kitchenResult.message?.status !== "success") {
          throw new Error(kitchenResult.message?.message || kitchenResult.exception || "Failed to dispatch item in Kitchen Note");
        }

        const invoiceUpdateSuccess = await updatePosInvoiceItemDispatchStatus(orderName, item.item_code);
        if (!invoiceUpdateSuccess) {
          console.warn("Dispatch.jsx: Failed to update POS Invoice item dispatch status, but Kitchen Note updated");
        }

        let homeDeliverySuccess = true;
        if (order.deliveryType === "DELIVERY") {
          try {
            homeDeliverySuccess = await createHomeDeliveryOrder(order, [item], secretCode);
            if (!homeDeliverySuccess) {
              console.warn("Dispatch.jsx: Failed to create Home Delivery Order, but item dispatched");
            }
          } catch (deliveryError) {
            console.warn("Dispatch.jsx: Failed to create Home Delivery Order, but item dispatched:", deliveryError.message);
            homeDeliverySuccess = false;
            dispatchError = deliveryError;
          }
        }

        setPreparedOrders((prev) => {
          const newPrev = prev ? {...prev} : {};
          if (!newPrev[orderName]) return newPrev;
          const updatedOrder = { ...newPrev[orderName] };
          updatedOrder.items = updatedOrder.items ? updatedOrder.items.filter((i) => i.id !== itemId) : [];
          const newPreparedOrders = { ...newPrev, [orderName]: updatedOrder };
          if (updatedOrder.items.length === 0) {
            delete newPreparedOrders[orderName];
          }
          console.log("Dispatch.jsx: Updated preparedOrders after dispatch:", JSON.stringify(newPreparedOrders, null, 2));
          return newPreparedOrders;
        });

        setSelectedItems((prev) =>
          prev.filter((i) => !(i.orderName === orderName && i.itemId === itemId))
        );

        if (order.deliveryType === "DELIVERY" && !homeDeliverySuccess) {
          alert(`Item ${item.name} dispatched successfully, but failed to assign delivery boy: ${dispatchError?.message || "Unknown error"}.`);
        } else {
          alert(
            `Item ${item.name} dispatched successfully${
              order.deliveryType === "DELIVERY" && homeDeliverySuccess ? " and assigned to delivery boy" : ""
            }.`
          );
        }
      } catch (error) {
        console.error("Dispatch.jsx: Error dispatching item:", error);
        alert(`Failed to dispatch item: ${error.message || "Please try again."}`);
      } finally {
        setDispatchingItems((prev) => ({ ...prev, [`${orderName}-${itemId}`]: false }));
      }
    },
    [preparedOrders, createHomeDeliveryOrder, updatePosInvoiceItemDispatchStatus, secretCodes, selectedDeliveryBoys, verifySecretCode]
  );

  const handleDispatchSelected = useCallback(
    async () => {
      if (selectedItems.length === 0) {
        alert("No items selected for dispatch.");
        return;
      }

      const confirmDispatch = window.confirm(
        `Are you sure you want to dispatch ${selectedItems.length} selected item(s)?`
      );
      if (!confirmDispatch) return;

      setDispatchingItems((prev) => ({
        ...prev,
        ...selectedItems.reduce((acc, { orderName, itemId }) => {
          acc[`${orderName}-${itemId}`] = true;
          return acc;
        }, {}),
      }));

      let dispatchErrors = [];
      try {
        const itemsByInvoice = selectedItems.reduce((acc, { orderName, itemId }) => {
          if (!acc[orderName]) {
            acc[orderName] = [];
          }
          const order = preparedOrders[orderName];
          const item = order?.items?.find((i) => i.id === itemId);
          if (item) {
            acc[orderName].push(item);
          }
          return acc;
        }, {});

        for (const [orderName, items] of Object.entries(itemsByInvoice)) {
          const order = preparedOrders[orderName];
          const secretCode = secretCodes[orderName] || "";

          if (order.deliveryType === "DELIVERY") {
            if (!selectedDeliveryBoys[orderName] || !secretCode) {
              dispatchErrors.push(`No delivery boy or secret code for order ${orderName}`);
              continue;
            }
            const verifyResult = await verifySecretCode(selectedDeliveryBoys[orderName], secretCode);
            if (verifyResult.status !== "success") {
              dispatchErrors.push(verifyResult.message || `The secret code is wrong for order ${orderName}. Items can't be dispatched.`);
              continue;
            }
          }

          for (const item of items) {
            const kitchenResponse = await fetch(
              "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.update_kitchen_note_status",
              {
                method: "POST",
                headers: {
                  Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  item_name: item.backendId,
                  status: "Dispatched",
                }),
              }
            );

            const kitchenResult = await kitchenResponse.json();
            if (kitchenResult.message?.status !== "success") {
              throw new Error(kitchenResult.message?.message || `Failed to dispatch item ${item.name}`);
            }

            const invoiceUpdateSuccess = await updatePosInvoiceItemDispatchStatus(orderName, item.item_code);
            if (!invoiceUpdateSuccess) {
              console.warn(`Dispatch.jsx: Failed to update POS Invoice item dispatch status for ${item.item_code}, but Kitchen Note updated`);
            }
          }

          let homeDeliverySuccess = true;
          if (order.deliveryType === "DELIVERY") {
            try {
              homeDeliverySuccess = await createHomeDeliveryOrder(order, items, secretCode);
              if (!homeDeliverySuccess) {
                console.warn(`Dispatch.jsx: Failed to create Home Delivery for invoice ${orderName}, but items dispatched`);
              }
            } catch (deliveryError) {
              console.warn(`Dispatch.jsx: Failed to create Home Delivery for invoice ${orderName}:`, deliveryError.message);
              homeDeliverySuccess = false;
              dispatchErrors.push(`Invoice ${orderName}: ${deliveryError.message}`);
            }
          }
        }

        setPreparedOrders((prev) => {
          const newPreparedOrders = prev ? {...prev} : {};
          selectedItems.forEach(({ orderName, itemId }) => {
            if (newPreparedOrders[orderName]) {
              newPreparedOrders[orderName].items = newPreparedOrders[orderName].items ? newPreparedOrders[orderName].items.filter(
                (i) => i.id !== itemId
              ) : [];
              if (newPreparedOrders[orderName].items.length === 0) {
                delete newPreparedOrders[orderName];
              }
            }
          });
          console.log("Dispatch.jsx: Updated preparedOrders after bulk dispatch:", JSON.stringify(newPreparedOrders, null, 2));
          return newPreparedOrders;
        });
        setSelectedItems([]);

        if (dispatchErrors.length > 0) {
          alert(`Some issues occurred:\n${dispatchErrors.join("\n")}`);
        } else {
          alert("Selected items dispatched successfully.");
        }
      } catch (error) {
        console.error("Dispatch.jsx: Error dispatching selected items:", error);
        alert(`Unable to dispatch selected items: ${error.message || "Please try again."}`);
      } finally {
        setDispatchingItems((prev) => ({
          ...prev,
          ...Object.fromEntries(
            selectedItems.map(({ orderName, itemId }) => [`${orderName}-${itemId}`, false])
          ),
        }));
      }
    },
    [selectedItems, preparedOrders, createHomeDeliveryOrder, updatePosInvoiceItemDispatchStatus, secretCodes, selectedDeliveryBoys, verifySecretCode]
  );

  const handleSelectItem = useCallback((orderName, itemId) => {
    setSelectedItems((prev) => {
      const newPrev = prev ? [...prev] : [];
      if (newPrev.some((item) => item.orderName === orderName && item.itemId === itemId)) {
        return newPrev.filter((item) => !(item.orderName === orderName && item.itemId === itemId));
      }
      return [...newPrev, { orderName, itemId }];
    });
  }, []);

  const handleSelectAll = useCallback((order, isChecked) => {
    setSelectedItems((prev) => {
      const newPrev = prev ? [...prev] : [];
      const orderItems = order.items ? order.items.map((item) => ({
        orderName: order.orderName,
        itemId: item.id,
      })) : [];
      if (isChecked) {
        return [...newPrev.filter((item) => item.orderName !== order.orderName), ...orderItems];
      }
      return newPrev.filter((item) => item.orderName !== order.orderName);
    });
  }, []);

  const handleDeliveryBoyChange = useCallback((orderName, employeeName) => {
    setSelectedDeliveryBoys((prev) => ({
      ...prev,
      [orderName]: employeeName,
    }));
    setSecretCodes((prev) => ({
      ...prev,
      [orderName]: "",
    }));
    setVerifiedStates((prev) => ({
      ...prev,
      [orderName]: false,
    }));
  }, []);

  const handleSecretCodeChange = useCallback((orderName, code) => {
    setSecretCodes((prev) => ({
      ...prev,
      [orderName]: code,
    }));
    setVerifiedStates((prev) => ({
      ...prev,
      [orderName]: false,
    }));
  }, []);

  const formatIngredients = useCallback((ingredients) => {
    if (!ingredients || ingredients.length === 0) return "";
    return ingredients
      .map((ing) => `${ing.name} - ${ing.quantity} ${ing.unit}`)
      .join(", ");
  }, []);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    fetchPreparedOrders();
    fetchDeliveryBoys();
    const intervalId = setInterval(fetchPreparedOrders, 30000);
    return () => clearInterval(intervalId);
  }, [fetchPreparedOrders, fetchDeliveryBoys]);

  const filteredPreparedOrders = useMemo(() => {
    if (!preparedOrders || typeof preparedOrders !== 'object') return [];
    return Object.entries(preparedOrders)
      .filter(([orderName]) => orderName.toLowerCase().includes(searchInvoiceId.toLowerCase()))
      .map(([orderName, order]) => ({
        orderName,
        ...order,
      }));
  }, [preparedOrders, searchInvoiceId]);

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
              <button className="btn btn-sm btn-outline-primary ms-2" onClick={fetchPreparedOrders}>
                Retry
              </button>
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
                <label htmlFor="searchInvoiceId" className="form-label fw-bold">
                  Filter by POS Invoice ID
                </label>
                <input
                  type="text"
                  id="searchInvoiceId"
                  className="form-control"
                  placeholder="Enter POS Invoice ID (e.g., ACC-PSINV-2025-00753)"
                  value={searchInvoiceId}
                  onChange={(e) => setSearchInvoiceId(e.target.value)}
                />
              </div>
              <div className="prepared-orders-list">
                {filteredPreparedOrders.map((order) => {
                  const allItemsSelected = order.items?.every((item) =>
                    selectedItems.some(
                      (selected) => selected.orderName === order.orderName && selected.itemId === item.id
                    )
                  ) || false;
                  const isVerified = verifiedStates[order.orderName] || false;
                  return (
                    <div
                      key={order.orderName}
                      className="order-section mb-3"
                      style={{ border: "1px solid #dee2e6", borderRadius: "8px" }}
                    >
                      <div
                        className="order-header p-3"
                        style={{ backgroundColor: "#f8f9fa", fontWeight: "600" }}
                      >
                        Order: {order.orderName} (Table: {order.tableNumber || "N/A"}, Chairs: {order.chairCount || 0}, Delivery: {order.deliveryType})
                        {order.deliveryType === "DELIVERY" && (
                          <div className="mt-2">
                            <label
                              htmlFor={`deliveryBoy-${order.orderName}`}
                              className="form-label fw-bold"
                            >
                              Select Delivery Boy
                            </label>
                            <select
                              id={`deliveryBoy-${order.orderName}`}
                              className="form-select mb-2"
                              value={selectedDeliveryBoys[order.orderName] || ""}
                              onChange={(e) => handleDeliveryBoyChange(order.orderName, e.target.value)}
                            >
                              <option value="">Select a delivery boy</option>
                              {deliveryBoys.map((boy) => (
                                <option key={boy.employee_name} value={boy.employee_name}>
                                  {boy.employee_name}
                                </option>
                              ))}
                            </select>
                            {selectedDeliveryBoys[order.orderName] && (
                              <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                  <label
                                    htmlFor={`secretCode-${order.orderName}`}
                                    className="form-label fw-bold"
                                  >
                                    Enter Secret Code
                                  </label>
                                  <input
                                    type="password"
                                    id={`secretCode-${order.orderName}`}
                                    className="form-control"
                                    placeholder="Enter delivery boy secret code"
                                    value={secretCodes[order.orderName] || ""}
                                    onChange={(e) => handleSecretCodeChange(order.orderName, e.target.value)}
                                  />
                                </div>
                                {/* <button
                                  className="btn btn-secondary ms-2"
                                  onClick={() => handleVerify(order.orderName)}
                                  disabled={!secretCodes[order.orderName]}
                                >
                                  Verify
                                </button> */}
                                {isVerified && <i className="bi bi-check-circle text-success ms-2" style={{fontSize: '1.5rem'}}></i>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="order-body p-0">
                        <div className="table-responsive">
                          <table className="table table-bordered table-striped mb-0">
                            <thead className="table-dark">
                              <tr>
                                <th scope="col">
                                  <input
                                    type="checkbox"
                                    checked={allItemsSelected}
                                    onChange={(e) => handleSelectAll(order, e.target.checked)}
                                    aria-label={`Select all items for order ${order.orderName}`}
                                    disabled={!order.items?.length}
                                  />
                                </th>
                                <th scope="col">Item</th>
                                <th scope="col">Variants</th>
                                <th scope="col">Quantity</th>
                                <th scope="col">Prepared Time</th>
                                <th scope="col">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items?.length ? (
                                order.items.map((item) => (
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
                                        aria-label={`Select item ${item.name}`}
                                      />
                                    </td>
                                    <td>{item.name}</td>
                                    <td>{item.custom_variants || "None"}</td>
                                    <td>{item.quantity}</td>
                                    <td>{item.preparedTime}</td>
                                    <td>
                                      <button
                                        className="btn btn-primary btn-sm position-relative"
                                        onClick={() => handleDispatchItem(order.orderName, item.id)}
                                        disabled={
                                          dispatchingItems[`${order.orderName}-${item.id}`] ||
                                          (order.deliveryType === "DELIVERY" &&
                                            (!selectedDeliveryBoys[order.orderName] ||
                                             !secretCodes[order.orderName]))
                                        }
                                        aria-label={`Dispatch item ${item.name}`}
                                      >
                                        Dispatch
                                        {dispatchingItems[`${order.orderName}-${item.id}`] && (
                                          <span
                                            className="spinner-border spinner-border-sm ms-2"
                                            role="status"
                                            aria-hidden="true"
                                          ></span>
                                        )}
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="6" className="text-center">
                                    No prepared items available
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
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