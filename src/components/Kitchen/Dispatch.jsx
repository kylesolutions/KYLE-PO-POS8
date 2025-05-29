import React, { useEffect, useState, useCallback } from "react";
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

  const createHomeDeliveryOrder = useCallback(async (order, item) => {
    try {
      const selectedDeliveryBoy = selectedDeliveryBoys[order.pos_invoice_id];
      if (!selectedDeliveryBoy) {
        throw new Error("No delivery boy selected for this order");
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

      const itemPrice =
        posInvoiceData.data.items?.find((i) => i.item_name === item.item_code)?.rate ||
        item.basePrice;

      const payload = {
        invoice_id: order.pos_invoice_id,
        employee_name: selectedDeliveryBoy,
        customer_name: posInvoiceData.data.customer_name || "Unknown",
        customer_address: posInvoiceData.data.customer_address || "Unknown",
        customer_phone: posInvoiceData.data.contact_mobile || "Unknown",
        items: [
          {
            item_name: item.name,
            price: parseFloat(itemPrice) || 0,
            variants: item.custom_variants || "",
          },
        ],
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
      throw error; // Rethrow to handle in caller
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
        const item = order?.items.find((i) => i.id === itemId);
        if (!item) throw new Error("Item not found");

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
            homeDeliverySuccess = await createHomeDeliveryOrder(order, item);
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
          const updatedOrder = { ...prev[orderName] };
          updatedOrder.items = updatedOrder.items.filter((i) => i.id !== itemId);
          const newPreparedOrders = { ...prev, [orderName]: updatedOrder };
          if (updatedOrder.items.length === 0) {
            delete newPreparedOrders[orderName];
          }
          localStorage.setItem("preparedOrders", JSON.stringify(newPreparedOrders));
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
    [preparedOrders, createHomeDeliveryOrder, updatePosInvoiceItemDispatchStatus]
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
        for (const { orderName, itemId } of selectedItems) {
          const order = preparedOrders[orderName];
          const item = order?.items.find((i) => i.id === itemId);
          if (!item) continue;

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

          let homeDeliverySuccess = true;
          if (order.deliveryType === "DELIVERY") {
            try {
              homeDeliverySuccess = await createHomeDeliveryOrder(order, item);
              if (!homeDeliverySuccess) {
                console.warn(`Dispatch.jsx: Failed to create Home Delivery for ${item.item_code}, but item dispatched`);
              }
            } catch (deliveryError) {
              console.warn(`Dispatch.jsx: Failed to create Home Delivery for ${item.item_code}:`, deliveryError.message);
              homeDeliverySuccess = false;
              dispatchErrors.push(`Item ${item.name}: ${deliveryError.message}`);
            }
          }
        }

        setPreparedOrders((prev) => {
          const newPreparedOrders = { ...prev };
          selectedItems.forEach(({ orderName, itemId }) => {
            if (newPreparedOrders[orderName]) {
              newPreparedOrders[orderName].items = newPreparedOrders[orderName].items.filter(
                (i) => i.id !== itemId
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

        if (dispatchErrors.length > 0) {
          alert(`Selected items dispatched successfully, but some delivery assignments failed:\n${dispatchErrors.join("\n")}`);
        } else {
          alert("Selected items dispatched successfully.");
        }
      } catch (error) {
        console.error("Dispatch.jsx: Error dispatching selected items:", error);
        alert(`Unable to dispatch selected items: ${error.message || "Please try again."}`);
      } finally {
        setDispatchingItems((prev) => ({
          ...prev,
          ...selectedItems.reduce((acc, { orderName, itemId }) => {
            acc[`${orderName}-${itemId}`] = false;
            return acc;
          }, {}),
        }));
      }
    },
    [selectedItems, preparedOrders, createHomeDeliveryOrder, updatePosInvoiceItemDispatchStatus]
  );

  const handleSelectItem = useCallback((orderName, itemId) => {
    setSelectedItems((prev) => {
      if (prev.some((item) => item.orderName === orderName && item.itemId === itemId)) {
        return prev.filter((item) => !(item.orderName === orderName && item.itemId === itemId));
      }
      return [...prev, { orderName, itemId }];
    });
  }, []);

  const handleSelectAll = useCallback((order, isChecked) => {
    setSelectedItems((prev) => {
      const orderItems = order.items.map((item) => ({
        orderName: order.orderName,
        itemId: item.id,
      }));
      if (isChecked) {
        return [...prev.filter((item) => item.orderName !== order.orderName), ...orderItems];
      }
      return prev.filter((item) => item.orderName !== order.orderName);
    });
  }, []);

  const handleDeliveryBoyChange = useCallback((orderName, employeeName) => {
    setSelectedDeliveryBoys((prev) => ({
      ...prev,
      [orderName]: employeeName,
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

  const filteredPreparedOrders = Object.entries(preparedOrders)
    .filter(([orderName]) => orderName.toLowerCase().includes(searchInvoiceId.toLowerCase()))
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
                              className="form-select"
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
                                <th scope="col">Kitchen</th>
                                <th scope="col">Quantity</th>
                                <th scope="col">Type</th>
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
                                        className="btn btn-primary btn-sm position-relative"
                                        onClick={() => handleDispatchItem(order.orderName, item.id)}
                                        disabled={
                                          dispatchingItems[`${order.orderName}-${item.id}`] ||
                                          (order.deliveryType === "DELIVERY" && !selectedDeliveryBoys[order.orderName])
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
                                  <td colSpan="8" className="text-center">
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

