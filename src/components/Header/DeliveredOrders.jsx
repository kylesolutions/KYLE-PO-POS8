import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function DeliveredOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryPersonFilter, setDeliveryPersonFilter] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("");
  const [deliveryDateFilter, setDeliveryDateFilter] = useState("");
  const [payingInvoices, setPayingInvoices] = useState({});
  const [printingInvoices, setPrintingInvoices] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);

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
      console.log("DeliveredOrders.jsx: Raw response from get_user_homedelivery_orders:", JSON.stringify(data, null, 2));

      if (data.message.status !== "success") {
        throw new Error(data.message.message || "Invalid response from server");
      }

      const allOrders = data.message.data || [];
      const delivered = allOrders.filter(order => order.delivery_status === "Delivered");
      setOrders(delivered);
      setFilteredOrders(delivered);
    } catch (error) {
      console.error("DeliveredOrders.jsx: Error fetching Home Delivery Orders:", error.message, error);
      setError(`Failed to load Delivered Orders: ${error.message}. Please try again or contact support.`);
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvoiceDetails = useCallback(async (invoiceId) => {
    setFetchingDetails(true);
    setInvoiceDetails(null);
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
      console.log("DeliveredOrders.jsx: get_pos_invoices Response:", JSON.stringify(result, null, 2));

      if (result.message.status !== "success" || !result.message.data) {
        throw new Error(result.message.message || "Invalid invoice data");
      }

      setInvoiceDetails(result.message.data);
    } catch (error) {
      console.error("DeliveredOrders.jsx: Error fetching invoice details:", error.message, error);
      alert(`Failed to fetch invoice details: ${error.message || "Please try again."}`);
    } finally {
      setFetchingDetails(false);
    }
  }, []);

  const handleViewDetails = useCallback((order) => {
    setSelectedOrder(order);
    fetchInvoiceDetails(order.invoice_id);
  }, [fetchInvoiceDetails]);

  const handleCloseModal = useCallback(() => {
    setSelectedOrder(null);
    setInvoiceDetails(null);
  }, []);

  const handleSearch = useCallback(() => {
    let filtered = orders;

    if (searchQuery) {
      filtered = filtered.filter(order => order.invoice_id.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (deliveryPersonFilter) {
      filtered = filtered.filter(order => order.employee_name === deliveryPersonFilter);
    }

    if (invoiceStatusFilter) {
      filtered = filtered.filter(order => order.invoice_status === invoiceStatusFilter);
    }

    if (deliveryDateFilter) {
      filtered = filtered.filter(order => {
        const deliveryDate = new Date(order.delivery_date).toISOString().split('T')[0];
        return deliveryDate === deliveryDateFilter;
      });
    }

    setFilteredOrders(filtered);
  }, [orders, searchQuery, deliveryPersonFilter, invoiceStatusFilter, deliveryDateFilter]);

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
      console.log("DeliveredOrders.jsx: mark_pos_invoice_paid Response:", JSON.stringify(result, null, 2));

      if (result.message.status !== "success") {
        throw new Error(result.message.message || "Failed to mark POS Invoice as Paid");
      }

      await fetchHomeDeliveryOrders();
      alert(`POS Invoice ${invoiceId} marked as Paid successfully.`);
    } catch (error) {
      console.error("DeliveredOrders.jsx: Error marking POS Invoice as Paid:", error.message, error);
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
      console.log("DeliveredOrders.jsx: get_pos_invoices Response:", JSON.stringify(result, null, 2));

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
                <p>Delivered Order</p>
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
      console.error("DeliveredOrders.jsx: Error printing invoice:", error.message, error);
      alert(`Failed to print invoice: ${error.message || "Please try again."}`);
    } finally {
      setPrintingInvoices((prev) => ({ ...prev, [invoiceId]: false }));
    }
  }, []);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    fetchHomeDeliveryOrders();
    const intervalId = setInterval(fetchHomeDeliveryOrders, 30000);
    return () => clearInterval(intervalId);
  }, [fetchHomeDeliveryOrders]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, deliveryPersonFilter, invoiceStatusFilter, deliveryDateFilter, handleSearch]);

  // Get unique delivery persons and invoice statuses for filter options
  const deliveryPersons = [...new Set(orders.map(order => order.employee_name).filter(name => name))];
  const invoiceStatuses = [...new Set(orders.map(order => order.invoice_status))];

  const totalAmount = filteredOrders.reduce((sum, order) => sum + (order.invoice_amount || 0), 0);

  return (
    <div className="container mt-5">
      <div className="card shadow-lg">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <button className="btn btn-light btn-sm" onClick={handleBack}>
            <i className="bi bi-arrow-left"></i> Back
          </button>
          <h3 className="mb-0">Delivered Orders</h3>
          <button className="btn btn-light btn-sm" onClick={fetchHomeDeliveryOrders}>
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search by Invoice ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={deliveryPersonFilter}
                onChange={(e) => setDeliveryPersonFilter(e.target.value)}
              >
                <option value="">All Delivery Persons</option>
                {deliveryPersons.map((person) => (
                  <option key={person} value={person}>{person}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={invoiceStatusFilter}
                onChange={(e) => setInvoiceStatusFilter(e.target.value)}
              >
                <option value="">All Invoice Statuses</option>
                {invoiceStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <input
                type="date"
                className="form-control"
                value={deliveryDateFilter}
                onChange={(e) => setDeliveryDateFilter(e.target.value)}
              />
            </div>
          </div>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading Delivered Orders...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger text-center" role="alert">
              {error}
              <button className="btn btn-sm btn-outline-primary ms-2" onClick={fetchHomeDeliveryOrders}>
                Retry
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="alert alert-info text-center" role="alert">
              No Delivered Orders found.
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
                      <th>Invoice Status</th>
                      <th>Delivery Status</th>
                      <th>Delivery Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.name}>
                        <td>{order.invoice_id}</td>
                        <td>{order.employee_name}</td>
                        <td>{order.customer_name}</td>
                        <td>{order.customer_address}</td>
                        <td>{order.customer_phone}</td>
                        <td>${(order.invoice_amount || 0).toFixed(2)}</td>
                        <td>{order.invoice_status}</td>
                        <td>{order.delivery_status}</td>
                        <td>{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : "N/A"}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-info btn-sm"
                              onClick={() => handleViewDetails(order)}
                              aria-label={`View details for ${order.invoice_id}`}
                            >
                              View
                            </button>
                            {order.invoice_status !== "Paid" && (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal for details */}
      {selectedOrder && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-labelledby="orderDetailsModal" aria-hidden="true">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Order Details for Invoice {selectedOrder.invoice_id}</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                {fetchingDetails ? (
                  <div className="text-center py-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading details...</p>
                  </div>
                ) : invoiceDetails ? (
                  <>
                    <h6>Customer Information</h6>
                    <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                    <p><strong>Address:</strong> {selectedOrder.customer_address}</p>
                    <p><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
                    <p><strong>Delivery Person:</strong> {selectedOrder.employee_name}</p>
                    <p><strong>Creation Date:</strong> {selectedOrder.creation}</p>
                    <p><strong>Delivery Date:</strong> {selectedOrder.delivery_date ? new Date(selectedOrder.delivery_date).toLocaleDateString() : "N/A"}</p>
                    <p><strong>Invoice Status:</strong> {selectedOrder.invoice_status}</p>
                    <p><strong>Delivery Status:</strong> {selectedOrder.delivery_status}</p>
                    <p><strong>Total Amount:</strong> ${(selectedOrder.invoice_amount || 0).toFixed(2)}</p>

                    <h6 className="mt-4">Items</h6>
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Item Name</th>
                          <th>Variants</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.item_name}</td>
                            <td>{item.variants || "N/A"}</td>
                            <td>${parseFloat(item.price || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <h6 className="mt-4">POS Invoice Items (Detailed)</h6>
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Quantity</th>
                          <th>Rate</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceDetails.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.item_name}{item.custom_size_variants ? ` (${item.custom_size_variants})` : ""}</td>
                            <td>{item.qty}</td>
                            <td>${parseFloat(item.rate).toFixed(2)}</td>
                            <td>${parseFloat(item.amount).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <h6 className="mt-4">Payments</h6>
                    {invoiceDetails.payments && invoiceDetails.payments.length > 0 ? (
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>Mode</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceDetails.payments.map((payment, index) => (
                            <tr key={index}>
                              <td>{payment.mode_of_payment}</td>
                              <td>${parseFloat(payment.amount).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>No payments recorded or invoice not paid yet.</p>
                    )}
                  </>
                ) : (
                  <p>No details available.</p>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
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

export default DeliveredOrders;