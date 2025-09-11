import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function HomeDeliveryOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payingInvoices, setPayingInvoices] = useState({});
  const [printingInvoices, setPrintingInvoices] = useState({});
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [selectedDeliveryBoys, setSelectedDeliveryBoys] = useState({});
  const [secretCodes, setSecretCodes] = useState({});
  const [verifiedStates, setVerifiedStates] = useState({});
  const [updatingInvoices, setUpdatingInvoices] = useState({});

  const fetchHomeDeliveryOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_user_homedelivery_orders",
        {
          method: "POST",
          headers: {
            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch Home Delivery Orders: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log("HomeDeliveryOrders.jsx: Raw response from get_user_homedelivery_orders:", JSON.stringify(data, null, 2));

      if (data.message.status !== "success") {
        throw new Error(data.message.message || "Invalid response from server");
      }

      setOrders(data.message.data || []);
    } catch (error) {
      console.error("HomeDeliveryOrders.jsx: Error fetching Home Delivery Orders:", error.message, error);
      setError(`Failed to load Home Delivery Orders: ${error.message}. Please try again or contact support.`);
      setOrders([]);
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
      console.log("HomeDeliveryOrders.jsx: get_available_delivery Response:", JSON.stringify(data, null, 2));

      if (!data.message || data.message.status !== "Success") {
        throw new Error(data.message?.message || "Failed to retrieve delivery boys");
      }

      setDeliveryBoys(data.message.data || []);
    } catch (error) {
      console.error("HomeDeliveryOrders.jsx: Error fetching delivery boys:", error.message, error);
      setError(`Failed to load delivery boys: ${error.message}. Please try again.`);
    }
  }, []);

  const verifySecretCode = useCallback(async (employeeName, secretCode, invoiceId) => {
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
      console.log("HomeDeliveryOrders.jsx: verify_delivery_boy_code Response:", JSON.stringify(result, null, 2));
      
      if (result.message.status === "success") {
        setVerifiedStates(prev => ({ ...prev, [invoiceId]: true }));
        alert("Secret code verified successfully");
      } else {
        setVerifiedStates(prev => ({ ...prev, [invoiceId]: false }));
        alert(result.message.message || "The secret code is wrong");
      }
      
      return result.message;
    } catch (error) {
      console.error("HomeDeliveryOrders.jsx: Error verifying secret code:", error);
      alert(`Failed to verify secret code: ${error.message || "Please try again."}`);
      return { status: "error", message: "Failed to verify code" };
    }
  }, []);

  const handleUpdateDeliveryBoy = useCallback(async (invoiceId) => {
    const employeeName = selectedDeliveryBoys[invoiceId];
    const secretCode = secretCodes[invoiceId];
    
    if (!employeeName || !secretCode) {
      alert("Please select a delivery boy and enter a secret code");
      return;
    }

    // Verify secret code first
    const verifyResult = await verifySecretCode(employeeName, secretCode, invoiceId);
    if (verifyResult.status !== "success") {
      return;
    }

    setUpdatingInvoices(prev => ({ ...prev, [invoiceId]: true }));
    try {
      const selectedBoy = deliveryBoys.find(boy => boy.employee_name === employeeName);
      const employeeNumber = selectedBoy?.cell_number || "";
      
      if (!employeeNumber) {
        console.warn(`HomeDeliveryOrders.jsx: No cell_number found for employee ${employeeName}`);
        alert("Warning: No phone number found for the selected delivery boy. Proceeding with empty employee number.");
      }

      const response = await fetch(
        "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.update_homedelivery_order_delivery_boy",
        {
          method: "POST",
          headers: {
            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoice_id: invoiceId,
            employee_name: employeeName,
            secret_code: secretCode,
            employee_number: employeeNumber
          }),
        }
      );

      const result = await response.json();
      console.log("HomeDeliveryOrders.jsx: update_homedelivery_order_delivery_boy Response:", JSON.stringify(result, null, 2));

      if (result.message.status !== "success") {
        throw new Error(result.message.message || "Failed to update delivery boy");
      }

      await fetchHomeDeliveryOrders();
      alert(`Delivery boy updated successfully for invoice ${invoiceId}.`);
    } catch (error) {
      console.error("HomeDeliveryOrders.jsx: Error updating delivery boy:", error.message, error);
      alert(`Failed to update delivery boy: ${error.message || "Please try again."}`);
    } finally {
      setUpdatingInvoices(prev => ({ ...prev, [invoiceId]: false }));
      setSelectedDeliveryBoys(prev => ({ ...prev, [invoiceId]: "" }));
      setSecretCodes(prev => ({ ...prev, [invoiceId]: "" }));
      setVerifiedStates(prev => ({ ...prev, [invoiceId]: false }));
    }
  }, [selectedDeliveryBoys, secretCodes, deliveryBoys, fetchHomeDeliveryOrders]);

  const handleMarkPaid = useCallback(async (invoiceId) => {
    if (!window.confirm(`Are you sure you want to mark POS Invoice ${invoiceId} as Paid?`)) {
      return;
    }

    setPayingInvoices((prev) => ({ ...prev, [invoiceId]: true }));
    try {
      const response = await fetch(
        "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.mark_pos_invoice_paid",
        {
          method: "POST",
          headers: {
            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ invoice_id: invoiceId }),
        }
      );

      const result = await response.json();
      console.log("HomeDeliveryOrders.jsx: mark_pos_invoice_paid Response:", JSON.stringify(result, null, 2));

      if (result.message.status !== "success") {
        throw new Error(result.message.message || "Failed to mark POS Invoice as Paid");
      }

      await fetchHomeDeliveryOrders();
      alert(`POS Invoice ${invoiceId} marked as Paid successfully.`);
    } catch (error) {
      console.error("HomeDeliveryOrders.jsx: Error marking POS Invoice as Paid:", error.message, error);
      alert(`Failed to mark POS Invoice as Paid: ${error.message || "Please try again."}`);
    } finally {
      setPayingInvoices((prev) => ({ ...prev, [invoiceId]: false }));
    }
  }, [fetchHomeDeliveryOrders]);

  const handlePrintInvoice = useCallback(async (invoiceId) => {
    setPrintingInvoices((prev) => ({ ...prev, [invoiceId]: true }));
    try {
      const response = await fetch(
        `/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoices?doc_name=${invoiceId}`,
        {
          method: "GET",
          headers: {
            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch invoice details: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log("HomeDeliveryOrders.jsx: get_pos_invoices Response:", JSON.stringify(result, null, 2));

      if (result.message.status !== "success" || !result.message.data) {
        throw new Error(result.message.message || "Invalid invoice data");
      }

      const invoice = result.message.data;

      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${invoiceId}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .invoice { max-width: 800px; margin: auto; padding: 20px; border: 1px solid #ccc; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h1 { margin: 0; }
              .details { margin-bottom: 20px; }
              .details p { margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .total { font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="invoice">
              <div class="header">
                <h1>Invoice ${invoiceId}</h1>
                <p>Home Delivery Order</p>
              </div>
              <div class="details">
                <p><strong>Customer:</strong> ${invoice.customer_name || "N/A"}</p>
                <p><strong>Address:</strong> ${invoice.customer_address || "N/A"}</p>
                <p><strong>Phone:</strong> ${invoice.contact_mobile || "N/A"}</p>
                <p><strong>Date:</strong> ${invoice.posting_date || "N/A"} ${invoice.posting_time || ""}</p>
                <p><strong>Status:</strong> ${invoice.status || "N/A"}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items
                    .map(
                      (item) => `
                        <tr>
                          <td>${item.item_name}${item.custom_size_variants ? ` (${item.custom_size_variants})` : ""}</td>
                          <td>${item.qty}</td>
                          <td>$${parseFloat(item.rate).toFixed(2)}</td>
                          <td>$${parseFloat(item.amount).toFixed(2)}</td>
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </table>
              <div class="details">
                <p><strong>Discount:</strong> $${parseFloat(invoice.discount_amount || 0).toFixed(2)}</p>
                <p class="total"><strong>Total:</strong> $${parseFloat(invoice.grand_total || invoice.total || 0).toFixed(2)}</p>
              </div>
              <div class="footer">
                <p>Thank you for your order!</p>
              </div>
            </div>
            <script>
              window.onload = () => {
                window.print();
                setTimeout(() => window.close(), 1000);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("HomeDeliveryOrders.jsx: Error printing invoice:", error.message, error);
      alert(`Failed to print invoice: ${error.message || "Please try again."}`);
    } finally {
      setPrintingInvoices((prev) => ({ ...prev, [invoiceId]: false }));
    }
  }, []);

  const handleDeliveryBoyChange = useCallback((invoiceId, employeeName) => {
    setSelectedDeliveryBoys(prev => ({
      ...prev,
      [invoiceId]: employeeName,
    }));
    setSecretCodes(prev => ({
      ...prev,
      [invoiceId]: "",
    }));
    setVerifiedStates(prev => ({
      ...prev,
      [invoiceId]: false,
    }));
  }, []);

  const handleSecretCodeChange = useCallback((invoiceId, code) => {
    setSecretCodes(prev => ({
      ...prev,
      [invoiceId]: code,
    }));
    setVerifiedStates(prev => ({
      ...prev,
      [invoiceId]: false,
    }));
  }, []);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    fetchHomeDeliveryOrders();
    fetchDeliveryBoys();
    const intervalId = setInterval(fetchHomeDeliveryOrders, 30000);
    return () => clearInterval(intervalId);
  }, [fetchHomeDeliveryOrders, fetchDeliveryBoys]);

  const totalAmount = orders.reduce((sum, order) => sum + (order.invoice_amount || 0), 0);

  return (
    <div className="container mt-5">
      <div className="card shadow-lg">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <button className="btn btn-light btn-sm" onClick={handleBack}>
            <i className="bi bi-arrow-left"></i> Back
          </button>
          <h3 className="mb-0">Home Delivery Orders</h3>
          <button className="btn btn-light btn-sm" onClick={fetchHomeDeliveryOrders}>
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading Home Delivery Orders...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger text-center" role="alert">
              {error}
              <button className="btn btn-sm btn-outline-primary ms-2" onClick={fetchHomeDeliveryOrders}>
                Retry
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="alert alert-info text-center" role="alert">
              No Home Delivery Orders assigned by you.
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Total Amount: ${totalAmount.toFixed(2)}</h5>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-striped">
                  <thead className="table-dark">
                    <tr>
                      <th>Invoice ID</th>
                      <th>Delivery Person</th>
                      <th>Customer Name</th>
                      <th>Address</th>
                      <th>Phone</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                      <th>Update Delivery Boy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.name}>
                        <td>{order.invoice_id}</td>
                        <td>{order.employee_name}</td>
                        <td>{order.customer_name}</td>
                        <td>{order.customer_address}</td>
                        <td>{order.customer_phone}</td>
                        <td>${(order.invoice_amount || 0).toFixed(2)}</td>
                        <td>{order.invoice_status}</td>
                        <td>
                          <div className="d-flex gap-2">
                            {order.invoice_status !== "Paid" ? (
                              <button
                                className="btn btn-success btn-sm position-relative"
                                onClick={() => handleMarkPaid(order.invoice_id)}
                                disabled={payingInvoices[order.invoice_id]}
                                aria-label={`Mark ${order.invoice_id} as Paid`}
                              >
                                Paid
                                {payingInvoices[order.invoice_id] && (
                                  <span
                                    className="spinner-border spinner-border-sm ms-2"
                                    role="status"
                                    aria-hidden="true"
                                  ></span>
                                )}
                              </button>
                            ) : (
                              <span className="text-muted">Already Paid</span>
                            )}
                            <button
                              className="btn btn-primary btn-sm position-relative"
                              onClick={() => handlePrintInvoice(order.invoice_id)}
                              disabled={printingInvoices[order.invoice_id]}
                              aria-label={`Print ${order.invoice_id}`}
                            >
                              Print
                              {printingInvoices[order.invoice_id] && (
                                <span
                                  className="spinner-border spinner-border-sm ms-2"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                              )}
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-2">
                            <select
                              className="form-select"
                              value={selectedDeliveryBoys[order.invoice_id] || ""}
                              onChange={(e) => handleDeliveryBoyChange(order.invoice_id, e.target.value)}
                              disabled={order.invoice_status === "Paid" || updatingInvoices[order.invoice_id]}
                            >
                              <option value="">Select a delivery boy</option>
                              {deliveryBoys.map((boy) => (
                                <option key={boy.employee_name} value={boy.employee_name}>
                                  {boy.employee_name}
                                </option>
                              ))}
                            </select>
                            {selectedDeliveryBoys[order.invoice_id] && (
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  type="password"
                                  className="form-control"
                                  placeholder="Enter secret code"
                                  value={secretCodes[order.invoice_id] || ""}
                                  onChange={(e) => handleSecretCodeChange(order.invoice_id, e.target.value)}
                                  disabled={order.invoice_status === "Paid" || updatingInvoices[order.invoice_id]}
                                />
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => verifySecretCode(selectedDeliveryBoys[order.invoice_id], secretCodes[order.invoice_id], order.invoice_id)}
                                  disabled={!secretCodes[order.invoice_id] || order.invoice_status === "Paid" || updatingInvoices[order.invoice_id]}
                                >
                                  Verify
                                </button>
                                {verifiedStates[order.invoice_id] && (
                                  <i className="bi bi-check-circle text-success" style={{ fontSize: '1.5rem' }}></i>
                                )}
                              </div>
                            )}
                            <button
                              className="btn btn-warning btn-sm position-relative"
                              onClick={() => handleUpdateDeliveryBoy(order.invoice_id)}
                              disabled={
                                !selectedDeliveryBoys[order.invoice_id] ||
                                !secretCodes[order.invoice_id] ||
                                !verifiedStates[order.invoice_id] ||
                                order.invoice_status === "Paid" ||
                                updatingInvoices[order.invoice_id]
                              }
                              aria-label={`Update delivery boy for ${order.invoice_id}`}
                            >
                              Update
                              {updatingInvoices[order.invoice_id] && (
                                <span
                                  className="spinner-border spinner-border-sm ms-2"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomeDeliveryOrders;