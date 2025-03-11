import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function SalesInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterId, setFilterId] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const fetchInvoices = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        "http://109.199.100.136:6060/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoice",
        {
          headers: {
            "Authorization": "token 0bde704e8493354:5709b3ab1a1cb1a",
          },
        }
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

  const categorizeInvoices = () => {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const todayInvoices = [];
    const weekInvoices = [];
    const olderInvoices = [];

    invoices.forEach((invoice) => {
      const invoiceDate = invoice.posting_date ? new Date(invoice.posting_date) : null;
      if (!invoiceDate) {
        olderInvoices.push(invoice);
        return;
      }
      if (invoiceDate >= startOfToday) {
        todayInvoices.push(invoice);
      } else if (invoiceDate >= startOfWeek) {
        weekInvoices.push(invoice);
      } else {
        olderInvoices.push(invoice);
      }
    });

    return { todayInvoices, weekInvoices, olderInvoices };
  };

  const filterInvoices = (invoiceList) => {
    return invoiceList.filter((invoice) => {
      const matchesId = invoice.name.toLowerCase().includes(filterId.toLowerCase());
      const matchesDate = filterDate
        ? (invoice.posting_date || "").includes(filterDate)
        : true;
      return matchesId && matchesDate;
    });
  };

  const handleFilterIdChange = (e) => setFilterId(e.target.value);
  const handleFilterDateChange = (e) => setFilterDate(e.target.value);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const generateInvoiceHTML = (invoice) => {
    return `
      <html>
        <head>
          <title>Invoice ${invoice.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .invoice-container { max-width: 800px; margin: auto; }
            .invoice-header { text-align: center; margin-bottom: 20px; }
            .invoice-details { margin-bottom: 20px; }
            .invoice-details p { margin: 5px 0; }
            .customer-details { border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .footer { text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <h2>POS Invoice</h2>
              <h4>Invoice ID: ${invoice.name}</h4>
            </div>
            <div class="customer-details">
              <p><strong>Customer Name:</strong> ${invoice.customer_details?.customer_name || "N/A"}</p>
              <p><strong>Email:</strong> ${invoice.customer_details?.email_id || "N/A"}</p>
              <p><strong>Phone Number:</strong> ${invoice.customer_details?.mobile_no || "N/A"}</p>
            </div>
            <div class="invoice-details">
              <p><strong>Posting Date:</strong> ${formatDate(invoice.posting_date)}</p>
              <p><strong>Grand Total:</strong> ₹${invoice.grand_total || 0}</p>
              <p><strong>Total Taxes:</strong> ₹${invoice.total_taxes_and_charges || 0}</p>
              <p><strong>Currency:</strong> ${invoice.currency || "INR"}</p>
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
            <div class="footer">
              <p><strong>Paid Amount:</strong> ₹${invoice.paid_amount || 0}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintInvoice = (invoice) => {
    const printWindow = window.open("", "_blank");
    const invoiceHTML = generateInvoiceHTML(invoice);
    printWindow.document.write(invoiceHTML);
    printWindow.document.write(`
      <script>
        window.print();
        window.onafterprint = function() { window.close(); };
      </script>
    `);
    printWindow.document.close();
  };

  const handleSendEmail = async (invoice) => {
    const email = invoice.customer_details?.email_id;
    if (!email || email === "N/A") {
      alert("No valid email address available for this customer.");
      return;
    }

    const invoiceHTML = generateInvoiceHTML(invoice);
    const subject = `Invoice ${invoice.name} - Your Receipt`;

    try {
      const response = await fetch(
        "http://109.199.100.136:6060/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.send_email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "token 0bde704e8493354:5709b3ab1a1cb1a",
            "Expect": "", // Suppress Expect header to avoid 417
          },
          body: JSON.stringify({
            recipient: email,
            subject: subject,
            content: invoiceHTML,
          }),
        }
      );

      const responseText = await response.text(); // Get raw response for debugging
      console.log("Raw response:", responseText);

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.status} - ${responseText}`);
      }

      const result = JSON.parse(responseText); // Parse JSON manually
      if (result.status === "success") {
        alert(`Invoice successfully sent to ${email}`);
      } else {
        alert(`Failed to send email: ${result.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Email send error:", err);
      // Convert error to a readable string, handling both message and full object
      const errorMessage = err.message || JSON.stringify(err);
      alert(`Error sending email: ${errorMessage}`);
    }
  };

  const renderInvoiceTable = (invoiceList) => {
    const filtered = filterInvoices(invoiceList);
    if (filtered.length === 0) {
      return <p className="text-center">No invoices match the filter</p>;
    }

    return (
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
            {filtered.map((invoice) => (
              <tr key={invoice.name}>
                <td>{invoice.name}</td>
                <td>{invoice.customer_details?.customer_name || "N/A"}</td>
                <td>{invoice.posting_date || "N/A"}</td>
                <td>₹{invoice.grand_total || 0}</td>
                <td>₹{invoice.total_taxes_and_charges || 0}</td>
                <td>{invoice.currency || "INR"}</td>
                <td>₹{invoice.paid_amount || 0}</td>
                <td>
                  {invoice.pos_invoice_items && invoice.pos_invoice_items.length > 0 ? (
                    <ul className="list-unstyled">
                      {invoice.pos_invoice_items.map((item, idx) => (
                        <li key={idx}>
                          {item.item_name || "N/A"} (Qty: {item.qty || 0}, ₹{item.amount || 0})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "No items"
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-success me-2"
                    onClick={() => handlePrintInvoice(invoice)}
                  >
                    Print
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleSendEmail(invoice)}
                  >
                    Send Email
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

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

    const { todayInvoices, weekInvoices, olderInvoices } = categorizeInvoices();

    return (
      <>
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

        <ul className="nav nav-tabs" id="invoiceTabs" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className="nav-link active"
              id="today-tab"
              data-bs-toggle="tab"
              data-bs-target="#today"
              type="button"
              role="tab"
              aria-controls="today"
              aria-selected="true"
            >
              Today ({todayInvoices.length})
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className="nav-link"
              id="week-tab"
              data-bs-toggle="tab"
              data-bs-target="#week"
              type="button"
              role="tab"
              aria-controls="week"
              aria-selected="false"
            >
              This Week ({weekInvoices.length})
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className="nav-link"
              id="older-tab"
              data-bs-toggle="tab"
              data-bs-target="#older"
              type="button"
              role="tab"
              aria-controls="older"
              aria-selected="false"
            >
              Older ({olderInvoices.length})
            </button>
          </li>
        </ul>

        <div className="tab-content" id="invoiceTabContent">
          <div
            className="tab-pane fade show active"
            id="today"
            role="tabpanel"
            aria-labelledby="today-tab"
          >
            {renderInvoiceTable(todayInvoices)}
          </div>
          <div
            className="tab-pane fade"
            id="week"
            role="tabpanel"
            aria-labelledby="week-tab"
          >
            {renderInvoiceTable(weekInvoices)}
          </div>
          <div
            className="tab-pane fade"
            id="older"
            role="tabpanel"
            aria-labelledby="older-tab"
          >
            {renderInvoiceTable(olderInvoices)}
          </div>
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