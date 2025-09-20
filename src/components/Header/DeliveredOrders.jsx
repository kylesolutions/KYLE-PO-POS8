import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Search, Filter, Eye, DollarSign, Printer, Calendar, User, MapPin, Phone, Package, X, ChevronDown } from "lucide-react";
import "./DeliveredOrders.css";

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
  const [showFilters, setShowFilters] = useState(false);

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
      filtered = filtered.filter(order => 
        order.invoice_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
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
              body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
              .invoice { max-width: 800px; margin: auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
              .header h1 { margin: 0; color: #1f2937; font-size: 32px; font-weight: 700; }
              .header p { color: #6b7280; font-size: 16px; margin: 8px 0 0 0; }
              .details { margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .details p { margin: 8px 0; color: #374151; }
              .details strong { color: #1f2937; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
              th { background: #f9fafb; color: #1f2937; font-weight: 600; }
              td { color: #374151; }
              .total-section { background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px; }
              .total { font-weight: 700; font-size: 18px; color: #1f2937; }
              .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="invoice">
              <div class="header">
                <h1>Invoice ${invoiceId}</h1>
                <p>Delivered Order Receipt</p>
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
                  <p><strong>Invoice ID:</strong> ${invoiceId}</p>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Qty</th>
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
              <div class="total-section">
                <p><strong>Discount:</strong> $${parseFloat(invoice.discount_amount || 0).toFixed(2)}</p>
                <p class="total"><strong>Total Amount:</strong> $${parseFloat(invoice.grand_total || invoice.total || 0).toFixed(2)}</p>
              </div>
              <div class="footer">
                <p>Thank you for choosing our service!</p>
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

  const clearFilters = () => {
    setSearchQuery("");
    setDeliveryPersonFilter("");
    setInvoiceStatusFilter("");
    setDeliveryDateFilter("");
  };

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
  const activeFiltersCount = [searchQuery, deliveryPersonFilter, invoiceStatusFilter, deliveryDateFilter].filter(f => f).length;

  return (
    <div className="delivered-orders-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <button className="back-btn" onClick={handleBack}>
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <div className="title-section">
              <h1>Delivered Orders</h1>
              <p>Manage and track all completed deliveries</p>
            </div>
          </div>
          <button className="refresh-btn" onClick={fetchHomeDeliveryOrders}>
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Search and Filters */}
        <div className="search-filter-section">
          <div className="search-bar">
            <div className="search-input-wrapper">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search by Invoice ID or Customer Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="filter-controls">
            <button 
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="filter-badge">{activeFiltersCount}</span>
              )}
              <ChevronDown size={16} className={`chevron ${showFilters ? 'rotated' : ''}`} />
            </button>

            {activeFiltersCount > 0 && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="filter-panel">
            <div className="filter-row">
              <div className="filter-group">
                <label>Delivery Person</label>
                <select
                  value={deliveryPersonFilter}
                  onChange={(e) => setDeliveryPersonFilter(e.target.value)}
                >
                  <option value="">All Delivery Persons</option>
                  {deliveryPersons.map((person) => (
                    <option key={person} value={person}>{person}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Invoice Status</label>
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {invoiceStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Delivery Date</label>
                <input
                  type="date"
                  value={deliveryDateFilter}
                  onChange={(e) => setDeliveryDateFilter(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div className="summary-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <Package size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{filteredOrders.length}</span>
                <span className="stat-label">Total Orders</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <DollarSign size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">${totalAmount.toFixed(2)}</span>
                <span className="stat-label">Total Amount</span>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="content-area">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading delivered orders...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>Unable to Load Orders</h3>
              <p>{error}</p>
              <button className="retry-btn" onClick={fetchHomeDeliveryOrders}>
                Try Again
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No Delivered Orders Found</h3>
              <p>No orders match your current search criteria.</p>
            </div>
          ) : (
            <div className="orders-grid">
              {filteredOrders.map((order) => (
                <div key={order.name} className="order-card">
                  <div className="order-header">
                    <div className="invoice-id">#{order.invoice_id}</div>
                    <div className={`status-badge ${order.invoice_status.toLowerCase().replace(' ', '-')}`}>
                      {order.invoice_status}
                    </div>
                  </div>

                  <div className="order-info">
                    <div className="info-row">
                      <User size={16} />
                      <span>{order.customer_name}</span>
                    </div>
                    <div className="info-row">
                      <MapPin size={16} />
                      <span>{order.customer_address}</span>
                    </div>
                    <div className="info-row">
                      <Phone size={16} />
                      <span>{order.customer_phone}</span>
                    </div>
                    <div className="info-row">
                      <Calendar size={16} />
                      <span>{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : "N/A"}</span>
                    </div>
                  </div>

                  <div className="order-footer">
                    <div className="amount">
                      <span className="amount-label">Total</span>
                      <span className="amount-value">${(order.invoice_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="delivery-person">
                      Delivered by: <strong>{order.employee_name}</strong>
                    </div>
                  </div>

                  <div className="order-actions">
                    <button
                      className="action-btn view-btn"
                      onClick={() => handleViewDetails(order)}
                    >
                      <Eye size={16} />
                      <span>View Details</span>
                    </button>

                    {order.invoice_status !== "Paid" && (
                      <button
                        className="action-btn paid-btn"
                        onClick={() => handleMarkPaid(order.invoice_id)}
                        disabled={payingInvoices[order.invoice_id]}
                      >
                        <DollarSign size={16} />
                        <span>Mark Paid</span>
                        {payingInvoices[order.invoice_id] && (
                          <div className="btn-spinner"></div>
                        )}
                      </button>
                    )}

                    <button
                      className="action-btn print-btn"
                      onClick={() => handlePrintInvoice(order.invoice_id)}
                      disabled={printingInvoices[order.invoice_id]}
                    >
                      <Printer size={16} />
                      <span>Print</span>
                      {printingInvoices[order.invoice_id] && (
                        <div className="btn-spinner"></div>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for Order Details */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details - Invoice #{selectedOrder.invoice_id}</h2>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {fetchingDetails ? (
                <div className="modal-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading order details...</p>
                </div>
              ) : invoiceDetails ? (
                <div className="order-details">
                  <div className="details-grid">
                    <div className="details-section">
                      <h3>Customer Information</h3>
                      <div className="details-content">
                        <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                        <p><strong>Address:</strong> {selectedOrder.customer_address}</p>
                        <p><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
                        <p><strong>Delivery Person:</strong> {selectedOrder.employee_name}</p>
                      </div>
                    </div>

                    <div className="details-section">
                      <h3>Order Information</h3>
                      <div className="details-content">
                        <p><strong>Creation Date:</strong> {new Date(selectedOrder.creation).toLocaleDateString()}</p>
                        <p><strong>Delivery Date:</strong> {selectedOrder.delivery_date ? new Date(selectedOrder.delivery_date).toLocaleDateString() : "N/A"}</p>
                        <p><strong>Invoice Status:</strong> {selectedOrder.invoice_status}</p>
                        <p><strong>Delivery Status:</strong> {selectedOrder.delivery_status}</p>
                        <p><strong>Total Amount:</strong> ${(selectedOrder.invoice_amount || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="details-section">
                    <h3>Order Items</h3>
                    <div className="items-table">
                      <div className="table-header">
                        <div>Item Name</div>
                        <div>Variants</div>
                        <div>Price</div>
                      </div>
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="table-row">
                          <div>{item.item_name}</div>
                          <div>{item.variants || "N/A"}</div>
                          <div>${parseFloat(item.price || 0).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="details-section">
                    <h3>Invoice Items (Detailed)</h3>
                    <div className="items-table">
                      <div className="table-header">
                        <div>Item</div>
                        <div>Quantity</div>
                        <div>Rate</div>
                        <div>Amount</div>
                      </div>
                      {invoiceDetails.items.map((item, index) => (
                        <div key={index} className="table-row">
                          <div>
                            {item.item_name}
                            {item.custom_size_variants && ` (${item.custom_size_variants})`}
                          </div>
                          <div>{item.qty}</div>
                          <div>${parseFloat(item.rate).toFixed(2)}</div>
                          <div>${parseFloat(item.amount).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {invoiceDetails.payments && invoiceDetails.payments.length > 0 && (
                    <div className="details-section">
                      <h3>Payment Information</h3>
                      <div className="items-table">
                        <div className="table-header">
                          <div>Payment Mode</div>
                          <div>Amount</div>
                        </div>
                        {invoiceDetails.payments.map((payment, index) => (
                          <div key={index} className="table-row">
                            <div>{payment.mode_of_payment}</div>
                            <div>${parseFloat(payment.amount).toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-details">
                  <p>No details available for this order.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="modal-close-btn-secondary" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveredOrders;