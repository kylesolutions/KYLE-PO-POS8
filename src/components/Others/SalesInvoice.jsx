import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function SalesInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterId, setFilterId] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterTime, setFilterTime] = useState("");
  const [filterMobile, setFilterMobile] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        "http://109.199.100.136:6060/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoice_list",
        {
          headers: {
            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
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

  const filterInvoices = (invoiceList) => {
    return invoiceList.filter((invoice) => {
      const matchesId = invoice.name.toLowerCase().includes(filterId.toLowerCase());
      const matchesDate = filterDate
        ? (invoice.posting_date || "").includes(filterDate)
        : true;
      const matchesTime = filterTime
        ? (invoice.posting_date || "").includes(filterTime)
        : true;
      const matchesMobile = filterMobile
        ? (invoice.customer_details?.mobile_no || "").toLowerCase().includes(filterMobile.toLowerCase())
        : true;
      return matchesId && matchesDate && matchesTime && matchesMobile;
    });
  };

  const handleFilterIdChange = (e) => setFilterId(e.target.value);
  const handleFilterDateChange = (e) => setFilterDate(e.target.value);
  const handleFilterTimeChange = (e) => setFilterTime(e.target.value);
  const handleFilterMobileChange = (e) => setFilterMobile(e.target.value);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const generateInvoiceHTML = (invoice) => {
    return `
      <html>
        <head>
          <title>Invoice</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              margin: 0; 
              font-size: 12px; 
            }
            .invoice-container { 
              max-width: 800px; 
              margin: 0 auto; 
            }
            .invoice-details { 
              margin-bottom: 15px; 
            }
            .invoice-details p, .customer-details p { 
              margin: 5px 0; 
            }
            .customer-details { 
              margin-bottom: 15px; 
              border-bottom: 1px solid #000; 
              padding-bottom: 10px; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 15px; 
            }
            th, td { 
              border: 1px solid #000; 
              padding: 8px; 
              text-align: left; 
            }
            th { 
              font-weight: bold; 
            }
            .footer { 
              display: flex; 
              justify-content: flex-end; 
              margin-top: 15px; 
            }
            .footer .totals { 
              text-align: right; 
            }
            .footer p { 
              margin: 5px 0; 
            }
            @media print {
              @page { margin: 0; }
              body { padding-top: 0; }
              header, footer { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-details">
              <p><strong>Invoice ID:</strong> ${invoice.name}</p>
              <p><strong>Posting Date:</strong> ${formatDate(invoice.posting_date)}</p>
            </div>
            <div class="customer-details">
              <p><strong>Customer Name:</strong> ${invoice.customer_details?.customer_name || "N/A"}</p>
              ${
                invoice.customer_details?.address
                  ? `<p><strong>Address:</strong> ${invoice.customer_details.address}</p>`
                  : ""
              }
              <p><strong>Phone Number:</strong> ${invoice.customer_details?.mobile_no || "N/A"}</p>
            </div>
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
              <div class="totals">
                <p><strong>Total Taxes:</strong> ₹${invoice.total_taxes_and_charges || 0}</p>
                <p><strong>Currency:</strong> ${invoice.currency || "INR"}</p>
                <p><strong>Paid Amount:</strong> ₹${invoice.paid_amount || 0}</p>
              </div>
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
            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
            "Expect": "",
          },
          body: JSON.stringify({
            recipient: email,
            subject: subject,
            content: invoiceHTML,
          }),
        }
      );

      const result = await response.json();
      if (result.status === "success") {
        alert(`Invoice successfully sent to ${email}`);
      } else {
        alert(`Failed to send email: ${result.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Email send error:", err);
      alert(`Error sending email: ${err.message || "Unknown error"}`);
    }
  };

  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const closePopup = () => {
    setSelectedInvoice(null);
  };

  const renderInvoiceTable = (invoiceList, title) => {
    if (invoiceList.length === 0) {
      return (
        <div className="mb-4">
          <h5 className="text-center mb-3">{title}</h5>
          <p className="text-center">No invoices in this section</p>
        </div>
      );
    }

    return (
      <div className="mb-4">
        <h5 className="text-center mb-3">{title}</h5>
        <div className="table-responsive" style={{ maxHeight: "600px", overflowY: "auto" }}>
          <table className="table table-bordered table-hover" style={{ fontSize: "14px" }}>
            <thead className="thead-dark">
              <tr>
                <th>Invoice ID</th>
                <th>Customer Name</th>
                <th>Grand Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoiceList.map((invoice) => (
                <tr key={invoice.name}>
                  <td>{invoice.name}</td>
                  <td>{invoice.customer_details?.customer_name || "N/A"}</td>
                  <td>₹{invoice.grand_total || 0}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => handleViewDetails(invoice)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderInvoicePopup = () => {
    if (!selectedInvoice) return null;

    return (
      <div className="modal" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Invoice Details - {selectedInvoice.name}</h5>
              <button type="button" className="btn-close" onClick={closePopup}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <p><strong>Posting Date:</strong> {formatDate(selectedInvoice.posting_date)}</p>
                <p><strong>Customer Name:</strong> {selectedInvoice.customer_details?.customer_name || "N/A"}</p>
                {selectedInvoice.customer_details?.address && (
                  <p><strong>Address:</strong> {selectedInvoice.customer_details.address}</p>
                )}
                <p><strong>Phone Number:</strong> {selectedInvoice.customer_details?.mobile_no || "N/A"}</p>
              </div>
              <h6>Items:</h6>
              {selectedInvoice.pos_invoice_items && selectedInvoice.pos_invoice_items.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-bordered">
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
                      {selectedInvoice.pos_invoice_items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.item_name || "N/A"}</td>
                          <td>{item.description || "N/A"}</td>
                          <td>{item.qty || 0}</td>
                          <td>₹{item.rate || 0}</td>
                          <td>₹{item.amount || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No items found</p>
              )}
              <div className="mt-3">
                <p><strong>Total Taxes:</strong> ₹{selectedInvoice.total_taxes_and_charges || 0}</p>
                <p><strong>Currency:</strong> {selectedInvoice.currency || "INR"}</p>
                <p><strong>Paid Amount:</strong> ₹{selectedInvoice.paid_amount || 0}</p>
                <p><strong>Grand Total:</strong> ₹{selectedInvoice.grand_total || 0}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-success" onClick={() => handlePrintInvoice(selectedInvoice)}>
                Print
              </button>
              <button className="btn btn-primary" onClick={() => handleSendEmail(selectedInvoice)}>
                Send Email
              </button>
              <button className="btn btn-secondary" onClick={closePopup}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const splitInvoicesIntoThree = () => {
    const filteredInvoices = filterInvoices(invoices);
    const third = Math.ceil(filteredInvoices.length / 3);
    const part1 = filteredInvoices.slice(0, third);
    const part2 = filteredInvoices.slice(third, third * 2);
    const part3 = filteredInvoices.slice(third * 2);
    return { part1, part2, part3 };
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

    const { part1, part2, part3 } = splitInvoicesIntoThree();

    return (
      <>
        <div className="row mb-4 justify-content-center">
          <div className="col-md-3">
            <label htmlFor="filterId" className="form-label mb-0 mt-2 fw-bold">
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
          <div className="col-md-3">
            <label htmlFor="filterDate" className="form-label mb-0 mt-2 fw-bold">
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
          <div className="col-md-3">
            <label htmlFor="filterTime" className="form-label mb-0 mt-2 fw-bold">
              Filter by Time:
            </label>
            <input
              type="text"
              id="filterTime"
              className="form-control"
              value={filterTime}
              onChange={handleFilterTimeChange}
              placeholder="Enter Time (e.g., 14:30)"
            />
          </div>
          <div className="col-md-3">
            <label htmlFor="filterMobile" className="form-label mb-0 mt-2 fw-bold">
              Filter by Mobile Number:
            </label>
            <input
              type="text"
              id="filterMobile"
              className="form-control"
              value={filterMobile}
              onChange={handleFilterMobileChange}
              placeholder="Enter Mobile (e.g., 9876543210)"
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-4 px-2">
            {renderInvoiceTable(part1, "Part 1")}
          </div>
          <div className="col-md-4 px-2">
            {renderInvoiceTable(part2, "Part 2")}
          </div>
          <div className="col-md-4 px-2">
            {renderInvoiceTable(part3, "Part 3")}
          </div>
        </div>
        {renderInvoicePopup()}
      </>
    );
  };

  return (
    <div className="container-fluid mt-4">
      <h3 className="mb-4 text-center">POS Invoices</h3>
      {renderContent()}
    </div>
  );
}

export default SalesInvoice;