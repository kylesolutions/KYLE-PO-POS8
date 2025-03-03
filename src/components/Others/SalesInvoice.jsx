import React, { useEffect, useState } from "react";

function SalesInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterId, setFilterId] = useState(""); // State for filtering by invoice ID
  const [filterDate, setFilterDate] = useState(""); // State for filtering by posting date

  const fetchInvoices = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://109.199.100.136:6060/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoice"
      );
      const data = await response.json();

      console.log("Full API Response:", data);

      if (data.message && Array.isArray(data.message.invoice)) {
        setInvoices(data.message.invoice);
      } else {
        setError("No valid invoice data found in the response");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("An error occurred while fetching the POS invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Filter invoices based on invoice ID (name) and posting date
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesId = invoice.name.toLowerCase().includes(filterId.toLowerCase());
    const matchesDate = filterDate
      ? (invoice.posting_date || "").includes(filterDate)
      : true; // If no date filter, include all
    return matchesId && matchesDate;
  });

  // Handle filter input changes
  const handleFilterIdChange = (e) => {
    setFilterId(e.target.value);
  };

  const handleFilterDateChange = (e) => {
    setFilterDate(e.target.value);
  };

  // Handle print for a single invoice
  const handlePrintInvoice = (invoice) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .invoice-container { max-width: 800px; margin: auto; }
            .invoice-header { text-align: center; margin-bottom: 20px; }
            .invoice-details { margin-bottom: 20px; }
            .invoice-details p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <h2>POS Invoice</h2>
              <h4>Invoice ID: ${invoice.name}</h4>
            </div>
            <div class="invoice-details">
              <p><strong>Customer:</strong> ${invoice.customer || "N/A"}</p>
              <p><strong>Posting Date:</strong> ${invoice.posting_date || "N/A"}</p>
              <p><strong>Grand Total:</strong> ₹${invoice.grand_total || 0}</p>
              <p><strong>Total Taxes:</strong> ₹${invoice.total_taxes_and_charges || 0}</p>
              <p><strong>Currency:</strong> ${invoice.currency || "INR"}</p>
              <p><strong>Paid Amount:</strong> ₹${invoice.paid_amount || 0}</p>
            </div>
            <h5>Items</h5>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${
                  invoice.pos_invoice_items && invoice.pos_invoice_items.length > 0
                    ? invoice.pos_invoice_items
                        .map(
                          (item) => `
                          <tr>
                            <td>${item.item_name || "N/A"}</td>
                            <td>${item.description || "N/A"}</td>
                            <td>${item.qty || 0}</td>
                            <td>₹${item.rate || 0}</td>
                            <td>₹${item.amount || 0}</td>
                          </tr>
                        `
                        )
                        .join("")
                    : `<tr><td colspan="5" style="text-align: center;">No items found</td></tr>`
                }
              </tbody>
            </table>
          </div>
          <script>
            window.print();
            window.onafterprint = function() { window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Render function with table, filters, and print buttons
  const renderContent = () => {
    if (loading) {
      return <p className="text-center">Loading invoices...</p>;
    }

    if (error) {
      return <div className="alert alert-danger">{error}</div>;
    }

    if (!invoices || invoices.length === 0) {
      return <p className="text-center">No POS Invoices Found</p>;
    }

    return (
      <>
        {/* Filter Inputs */}
        <div className="row mb-4">
          <div className="col-md-6">
            <label htmlFor="filterId" className="form-label">
              Filter by Invoice ID:
            </label>
            <input
              type="text"
              id="filterId"
              className="form-control"
              value={filterId}
              onChange={handleFilterIdChange}
              placeholder="Enter Invoice ID (e.g., POSINV-001)"
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="filterDate" className="form-label">
              Filter by Posting Date:
            </label>
            <input
              type="text"
              id="filterDate"
              className="form-control"
              value={filterDate}
              onChange={handleFilterDateChange}
              placeholder="Enter Date (e.g., 2025-03-01)"
            />
          </div>
        </div>

        {/* Invoices Table */}
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="thead-dark">
              <tr>
                <th>Invoice ID</th>
                <th>Customer</th>
                <th>Posting Date</th>
                <th>Grand Total (₹)</th>
                <th>Total Taxes (₹)</th>
                <th>Currency</th>
                <th>Paid Amount (₹)</th>
                <th>Items</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.name}>
                    <td>{invoice.name}</td>
                    <td>{invoice.customer || "N/A"}</td>
                    <td>{invoice.posting_date || "N/A"}</td>
                    <td>₹{invoice.grand_total || 0}</td>
                    <td>₹{invoice.total_taxes_and_charges || 0}</td>
                    <td>{invoice.currency || "INR"}</td>
                    <td>₹{invoice.paid_amount || 0}</td>
                    <td>
                      {invoice.pos_invoice_items &&
                      invoice.pos_invoice_items.length > 0 ? (
                        <ul className="list-unstyled">
                          {invoice.pos_invoice_items.map((item, idx) => (
                            <li key={idx}>
                              {item.item_name || "N/A"} (Qty: {item.qty || 0}, ₹
                              {item.amount || 0})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "No items"
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handlePrintInvoice(invoice)}
                      >
                        Print
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center">
                    No invoices match the filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-4">POS Invoices</h3>
      {renderContent()}
    </div>
  );
}

export default SalesInvoice;