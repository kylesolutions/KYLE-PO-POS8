import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  RefreshCw, 
  Printer, 
  CheckCircle, 
  XCircle, 
  Truck, 
  DollarSign,
  Phone,
  MapPin,
  User,
  Clock,
  AlertCircle,
  Package,
  Shield
} from "lucide-react";
import './HomeDeliveryOrders.css';

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
  const [cancelingInvoices, setCancelingInvoices] = useState({});
  const [deliveringInvoices, setDeliveringInvoices] = useState({});

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
  }, [selectedDeliveryBoys, secretCodes, deliveryBoys, fetchHomeDeliveryOrders, verifySecretCode]);

  const handleCancel = useCallback(async (invoiceId) => {
    if (!window.confirm(`Are you sure you want to cancel the home delivery order for invoice ${invoiceId}?`)) {
      return;
    }
    setCancelingInvoices((prev) => ({ ...prev, [invoiceId]: true }));
    try {
      const response = await fetch(
        "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.cancel_homedelivery_order",
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
      console.log("HomeDeliveryOrders.jsx: cancel_homedelivery_order Response:", JSON.stringify(result, null, 2));
      if (result.message.status !== "success") {
        throw new Error(result.message.message || "Failed to cancel home delivery order");
      }
      await fetchHomeDeliveryOrders();
      alert(`Home delivery order for invoice ${invoiceId} canceled successfully.`);
    } catch (error) {
      console.error("HomeDeliveryOrders.jsx: Error canceling home delivery order:", error.message, error);
      alert(`Failed to cancel home delivery order: ${error.message || "Please try again."}`);
    } finally {
      setCancelingInvoices((prev) => ({ ...prev, [invoiceId]: false }));
    }
  }, [fetchHomeDeliveryOrders]);

  const handleSubmitUnpaid = useCallback(async (invoiceId) => {
    if (!window.confirm(`Are you sure you want to submit POS Invoice ${invoiceId} as Unpaid?`)) {
      return;
    }
    setPayingInvoices((prev) => ({ ...prev, [invoiceId]: true }));
    try {
      const response = await fetch(
        "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.submit_pos_invoice_as_unpaid",
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
      console.log("HomeDeliveryOrders.jsx: submit_pos_invoice_as_unpaid Response:", JSON.stringify(result, null, 2));
      if (result.message.status !== "success") {
        throw new Error(result.message.message || "Failed to submit POS Invoice as Unpaid");
      }
      await fetchHomeDeliveryOrders();
      alert(`POS Invoice ${invoiceId} submitted as Unpaid successfully.`);
    } catch (error) {
      console.error("HomeDeliveryOrders.jsx: Error submitting POS Invoice as Unpaid:", error.message, error);
      alert(`Failed to submit POS Invoice as Unpaid: ${error.message || "Please try again."}`);
    } finally {
      setPayingInvoices((prev) => ({ ...prev, [invoiceId]: false }));
    }
  }, [fetchHomeDeliveryOrders]);

  const handleMarkDelivered = useCallback(async (invoiceId) => {
    if (!window.confirm(`Are you sure you want to mark the home delivery order for invoice ${invoiceId} as Delivered?`)) {
      return;
    }
    setDeliveringInvoices((prev) => ({ ...prev, [invoiceId]: true }));
    try {
      const response = await fetch(
        "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.mark_homedelivery_order_delivered",
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
      console.log("HomeDeliveryOrders.jsx: mark_homedelivery_order_delivered Response:", JSON.stringify(result, null, 2));
      if (result.message.status !== "success") {
        throw new Error(result.message.message || "Failed to mark home delivery order as Delivered");
      }
      await fetchHomeDeliveryOrders();
      alert(`Home delivery order for invoice ${invoiceId} marked as Delivered successfully.`);
    } catch (error) {
      console.error("HomeDeliveryOrders.jsx: Error marking home delivery order as Delivered:", error.message, error);
      alert(`Failed to mark home delivery order as Delivered: ${error.message || "Please try again."}`);
    } finally {
      setDeliveringInvoices((prev) => ({ ...prev, [invoiceId]: false }));
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
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; }
              .invoice { max-width: 800px; margin: auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
              .header h1 { margin: 0; color: #1e40af; font-size: 2rem; font-weight: 700; }
              .header p { margin: 5px 0 0 0; color: #64748b; font-size: 1.1rem; }
              .details { margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .details p { margin: 8px 0; line-height: 1.6; }
              .details strong { color: #374151; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border-radius: 8px; overflow: hidden; }
              th { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 16px; text-align: left; font-weight: 600; }
              td { border-bottom: 1px solid #e5e7eb; padding: 16px; }
              tr:hover { background-color: #f8fafc; }
              .total { font-weight: bold; font-size: 1.2rem; color: #1e40af; background-color: #eff6ff; padding: 15px; border-radius: 8px; }
              .footer { text-align: center; margin-top: 40px; color: #64748b; font-style: italic; }
            </style>
          </head>
          <body>
            <div class="invoice">
              <div class="header">
                <h1>Invoice ${invoiceId}</h1>
                <p>Home Delivery Order</p>
              </div>
              <div class="details">
                <div>
                  <p><strong>Customer:</strong> ${invoice.customer_name || "N/A"}</p>
                  <p><strong>Address:</strong> ${invoice.customer_address || "N/A"}</p>
                  <p><strong>Phone:</strong> ${invoice.contact_mobile || "N/A"}</p>
                </div>
                <div>
                  <p><strong>Date:</strong> ${invoice.posting_date || "N/A"} ${invoice.posting_time || ""}</p>
                  <p><strong>Status:</strong> ${invoice.status || "N/A"}</p>
                </div>
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

  const getStatusBadge = (status) => {
    const statusMap = {
      'Paid': { color: 'status-badge status-paid', icon: CheckCircle },
      'Unpaid': { color: 'status-badge status-unpaid', icon: Clock },
      'Pending': { color: 'status-badge status-pending', icon: Clock },
      'Delivered': { color: 'status-badge status-delivered', icon: CheckCircle },
      'Cancel': { color: 'status-badge status-cancelled', icon: XCircle },
    };
    
    const config = statusMap[status] || { color: 'status-badge status-unknown', icon: AlertCircle };
    const IconComponent = config.icon;
    
    return (
      <span className={config.color}>
        <IconComponent className="status-icon" />
        {status || 'Unknown'}
      </span>
    );
  };

  return (
    <div className="delivery-orders-container">
      <div className="delivery-orders-wrapper">
        {/* Header */}
        <div className="header-card">
          <div className="header-content">
            <div className="header-left">
              <button onClick={handleBack} className="btn btn-secondary btn-back">
                <ArrowLeft className="btn-icon" />
                Back
              </button>
              <div className="header-title">
                <h1 className="page-title">
                  <Package className="title-icon" />
                  Home Delivery Orders
                </h1>
                <p className="page-subtitle">Manage and track your delivery orders</p>
              </div>
            </div>
            <button
              onClick={fetchHomeDeliveryOrders}
              disabled={loading}
              className="btn btn-primary btn-refresh"
            >
              <RefreshCw className={`btn-icon ${loading ? 'spinning' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Summary Stats */}
          <div className="stats-container">
            <div className="stats-grid">
              <div className="stat-card stat-orders">
                <div className="stat-icon">
                  <Package />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Total Orders</p>
                  <p className="stat-value">{orders.length}</p>
                </div>
              </div>
              
              <div className="stat-card stat-amount">
                <div className="stat-icon">
                  <DollarSign />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Total Amount</p>
                  <p className="stat-value">${totalAmount.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="stat-card stat-pending">
                <div className="stat-icon">
                  <Clock />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Pending Orders</p>
                  <p className="stat-value">
                    {orders.filter(order => order.delivery_status === "Pending" || !order.delivery_status).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-title">Loading Home Delivery Orders</p>
              <p className="loading-subtitle">Please wait while we fetch your orders...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-card">
                <AlertCircle className="error-icon" />
                <h3 className="error-title">Error Loading Orders</h3>
                <p className="error-message">{error}</p>
                <button onClick={fetchHomeDeliveryOrders} className="btn btn-danger">
                  Try Again
                </button>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-container">
              <div className="empty-card">
                <Package className="empty-icon" />
                <h3 className="empty-title">No Orders Found</h3>
                <p className="empty-message">No home delivery orders assigned by you at the moment.</p>
              </div>
            </div>
          ) : (
            <div className="orders-grid">
              {orders.map((order) => (
                <div key={order.name} className="order-card">
                  <div className="order-content">
                    {/* Order Header */}
                    <div className="order-header">
                      <div className="order-info">
                        <div className="order-icon">
                          <Package />
                        </div>
                        <div className="order-details">
                          <h3 className="order-title">Invoice #{order.invoice_id}</h3>
                          <p className="order-id">Order ID: {order.name}</p>
                        </div>
                      </div>
                      <div className="order-status">
                        {getStatusBadge(order.invoice_status)}
                        {getStatusBadge(order.delivery_status || 'Pending')}
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="order-details-grid">
                      <div className="detail-item">
                        <User className="detail-icon" />
                        <div className="detail-content">
                          <p className="detail-label">Customer</p>
                          <p className="detail-value">{order.customer_name || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="detail-item">
                        <MapPin className="detail-icon" />
                        <div className="detail-content">
                          <p className="detail-label">Address</p>
                          <p className="detail-value" title={order.customer_address}>
                            {order.customer_address || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="detail-item">
                        <Phone className="detail-icon" />
                        <div className="detail-content">
                          <p className="detail-label">Phone</p>
                          <p className="detail-value">{order.customer_phone || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="detail-item">
                        <DollarSign className="detail-icon" />
                        <div className="detail-content">
                          <p className="detail-label">Amount</p>
                          <p className="detail-value">${(order.invoice_amount || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Person */}
                    {order.employee_name && (
                      <div className="delivery-person">
                        <div className="delivery-info">
                          <Truck className="delivery-icon" />
                          <div className="delivery-content">
                            <p className="delivery-label">Delivery Person</p>
                            <p className="delivery-name">{order.employee_name}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="order-actions">
                      {order.invoice_status !== "Paid" ? (
                        <button
                          onClick={() => handleSubmitUnpaid(order.invoice_id)}
                          disabled={payingInvoices[order.invoice_id]}
                          className="btn btn-success"
                        >
                          <DollarSign className="btn-icon" />
                          {payingInvoices[order.invoice_id] ? (
                            <>
                              <div className="btn-spinner"></div>
                              Processing...
                            </>
                          ) : (
                            'Mark as Paid'
                          )}
                        </button>
                      ) : (
                        <span className="paid-indicator">
                          <CheckCircle className="paid-icon" />
                          Already Paid
                        </span>
                      )}

                      <button
                        onClick={() => handlePrintInvoice(order.invoice_id)}
                        disabled={printingInvoices[order.invoice_id]}
                        className="btn btn-secondary"
                      >
                        <Printer className="btn-icon" />
                        {printingInvoices[order.invoice_id] ? (
                          <>
                            <div className="btn-spinner"></div>
                            Printing...
                          </>
                        ) : (
                          'Print Invoice'
                        )}
                      </button>

                      {order.delivery_status === "Pending" && order.invoice_status !== "Paid" && (
                        <button
                          onClick={() => handleMarkDelivered(order.invoice_id)}
                          disabled={deliveringInvoices[order.invoice_id]}
                          className="btn btn-primary"
                        >
                          <CheckCircle className="btn-icon" />
                          {deliveringInvoices[order.invoice_id] ? (
                            <>
                              <div className="btn-spinner"></div>
                              Marking...
                            </>
                          ) : (
                            'Mark Delivered'
                          )}
                        </button>
                      )}

                      {order.invoice_status !== "Paid" && order.delivery_status !== "Cancel" && (
                        <button
                          onClick={() => handleCancel(order.invoice_id)}
                          disabled={cancelingInvoices[order.invoice_id]}
                          className="btn btn-danger"
                        >
                          <XCircle className="btn-icon" />
                          {cancelingInvoices[order.invoice_id] ? (
                            <>
                              <div className="btn-spinner"></div>
                              Canceling...
                            </>
                          ) : (
                            'Cancel Order'
                          )}
                        </button>
                      )}
                    </div>

                    {/* Delivery Boy Assignment */}
                    {order.invoice_status !== "Paid" && order.delivery_status !== "Cancel" && (
                      <div className="delivery-assignment">
                        <h4 className="assignment-title">
                          <Truck className="assignment-icon" />
                          Update Delivery Person
                        </h4>
                        
                        <div className="assignment-form">
                          <div className="form-group">
                            <label className="form-label">Select Delivery Person</label>
                            <select
                              value={selectedDeliveryBoys[order.invoice_id] || ""}
                              onChange={(e) => handleDeliveryBoyChange(order.invoice_id, e.target.value)}
                              disabled={updatingInvoices[order.invoice_id]}
                              className="form-select"
                            >
                              <option value="">Choose a delivery person</option>
                              {deliveryBoys.map((boy) => (
                                <option key={boy.employee_name} value={boy.employee_name}>
                                  {boy.employee_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {selectedDeliveryBoys[order.invoice_id] && (
                            <div className="verification-section">
                              <div className="verification-input">
                                <input
                                  type="password"
                                  placeholder="Enter secret code"
                                  value={secretCodes[order.invoice_id] || ""}
                                  onChange={(e) => handleSecretCodeChange(order.invoice_id, e.target.value)}
                                  disabled={updatingInvoices[order.invoice_id]}
                                  className="form-input"
                                />
                                <button
                                  onClick={() => verifySecretCode(selectedDeliveryBoys[order.invoice_id], secretCodes[order.invoice_id], order.invoice_id)}
                                  disabled={!secretCodes[order.invoice_id] || updatingInvoices[order.invoice_id]}
                                  className="btn btn-secondary btn-verify"
                                >
                                  <Shield className="btn-icon" />
                                  Verify
                                </button>
                              </div>

                              {verifiedStates[order.invoice_id] && (
                                <div className="verification-success">
                                  <CheckCircle className="success-icon" />
                                  <span className="success-text">Code verified successfully</span>
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => handleUpdateDeliveryBoy(order.invoice_id)}
                            disabled={
                              !selectedDeliveryBoys[order.invoice_id] ||
                              !secretCodes[order.invoice_id] ||
                              !verifiedStates[order.invoice_id] ||
                              updatingInvoices[order.invoice_id]
                            }
                            className="btn btn-warning btn-update"
                          >
                            <Truck className="btn-icon" />
                            {updatingInvoices[order.invoice_id] ? (
                              <>
                                <div className="btn-spinner"></div>
                                Updating...
                              </>
                            ) : (
                              'Update Delivery Person'
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomeDeliveryOrders;