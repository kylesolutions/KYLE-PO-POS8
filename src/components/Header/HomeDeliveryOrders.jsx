import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function HomeDeliveryOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payingInvoices, setPayingInvoices] = useState({});
  const [printingInvoices, setPrintingInvoices] = useState({});

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
      // Fetch detailed invoice data
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

      // Generate printable HTML
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
                setTimeout(() => window.close(), 1000); // Close window after printing
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

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    fetchHomeDeliveryOrders();
    const intervalId = setInterval(fetchHomeDeliveryOrders, 30000);
    return () => clearInterval(intervalId);
  }, [fetchHomeDeliveryOrders]);

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