import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import './salesInvoice.css';

function SalesInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [offers, setOffers] = useState([]);
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
      console.log("Full Invoice API Response:", data);
      if (data.message && Array.isArray(data.message.invoice)) {
        setInvoices(data.message.invoice);
      } else {
        setError("No valid invoice data found in the response");
      }
    } catch (err) {
      console.error("Fetch invoices error:", err);
      setError("An error occurred while fetching the POS invoices.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    try {
      const response = await fetch(
        "http://109.199.100.136:6060/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_offers",
        {
          headers: {
            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
          },
        }
      );
      const data = await response.json();
      console.log("Full Offers API Response:", data);
      if (Array.isArray(data.message)) {
        const currentTime = new Date();
        const activeOffers = data.message.filter((offer) => {
          const start = new Date(offer.start_date);
          const end = new Date(offer.end_date);
          return start <= currentTime && currentTime <= end;
        });
        setOffers(activeOffers);
      } else {
        console.warn("No valid offers data found in the response");
        setOffers([]);
      }
    } catch (err) {
      console.error("Fetch offers error:", err);
      setOffers([]);
    }
  };

  useEffect(() => {
    Promise.all([fetchInvoices(), fetchOffers()]).finally(() => setLoading(false));
  }, []);

  const filterInvoices = (invoiceList) => {
    return invoiceList.filter((invoice) => {
      const matchesId = invoice.name.toLowerCase().includes(filterId.toLowerCase());
      const matchesDate = filterDate
        ? (invoice.posting_date || "").includes(filterDate)
        : true;
      const matchesTime = filterTime
        ? (invoice.posting_time || "").includes(filterTime)
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
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    try {
      const [hours, minutes, seconds] = timeString.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, seconds);
      return date.toLocaleString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch (error) {
      console.error("Error formatting time:", timeString, error);
      return "N/A";
    }
  };

  const formatDiscount = (invoice) => {
    const percentage = parseFloat(invoice.additional_discount_percentage) || 0;
    const amount = parseFloat(invoice.discount_amount) || 0;
    if (amount > 0) return `₹${amount.toFixed(2)}`;
    if (percentage > 0) return `${percentage}%`;
    return "N/A";
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
            .invoice-details, .customer-details, .footer .totals, .offers-details { 
              margin-bottom: 15px; 
            }
            .invoice-details p, .customer-details p, .footer .totals p, .offers-details p { 
              margin: 5px 0; 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
            }
            .invoice-details p strong, .customer-details p strong, .footer .totals p strong, .offers-details p strong { 
              text-align: left; 
              flex: 0 0 40%; 
            }
            .invoice-details p .value, .customer-details p .value, .footer .totals p .value, .offers-details p .value { 
              text-align: right; 
              flex: 0 0 60%; 
            }
            .customer-details { 
              border-bottom: 1px solid #000; 
              padding-bottom: 10px; 
            }
            .offers-details {
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 15px; 
            }
            th, td { 
              border: 1px solid #000; 
              padding: 8px; 
              text-align: right; 
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
              width: 100%; 
              max-width: 300px; 
            }
            .invoice-logo {
              display: flex;
              align-items: center;
              margin-bottom: 10px;
            }
            .invoice-logo img {
              width: 80px;
              height: 80px;
              margin-right: 10px;
            }
            .invoice-logo p {
              font-size: 16px;
              font-weight: bold;
              margin: 0;
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
              <div class="invoice-logo">
                <img src="/menuIcons/logo for restaurant ilustración de Stock.jpeg" alt="Dine 8 Logo"/>
                <p>Dine 8</p>
              </div>  
              <p><strong>Invoice ID:</strong> <span class="value">${invoice.name}</span></p>
              <p><strong>Posting Date:</strong> <span class="value">${formatDate(invoice.posting_date)}</span></p>
              <p><strong>Posting Time:</strong> <span class="value">${formatTime(invoice.posting_time)}</span></p>
            </div>
            <div class="customer-details">
              <p><strong>Customer Name:</strong> <span class="value">${invoice.customer_details?.customer_name || "N/A"}</span></p>
              ${
                invoice.customer_details?.address
                  ? `<p><strong>Address:</strong> <span class="value">${invoice.customer_details.address}</span></p>`
                  : ""
              }
              <p><strong>Phone Number:</strong> <span class="value">${invoice.customer_details?.mobile_no || "N/A"}</span></p>
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
                    : `<tr><td colspan="7" style="text-align: center;">No items found</td></tr>`
                }
              </tbody>
            </table>
            ${
              offers.length > 0
                ? `
                  <div class="offers-details">
                    <p><strong>Special Offers:</strong></p>
                    ${offers
                      .map(
                        (offer) =>
                          `<p><span class="value">${offer.messages || "N/A"} (Valid: ${formatDate(
                            offer.start_date
                          )} to ${formatDate(offer.end_date)})</span></p>`
                      )
                      .join("")}
                  </div>
                `
                : ""
            }
            <div class="footer">
              <div class="totals">
                <p><strong>Total Taxes:</strong> <span class="value">₹${invoice.total_taxes_and_charges || 0}</span></p>
                <p><strong>Discount:</strong> <span class="value">${formatDiscount(invoice)} (${
                  invoice.apply_discount_on || "Grand Total"
                })</span></p>
                <p><strong>Currency:</strong> <span class="value">${invoice.currency || "INR"}</span></p>
                <p><strong>Paid Amount:</strong> <span class="value">₹${invoice.paid_amount || 0}</span></p>
                <p><strong>Grand Total:</strong> <span class="value">₹${invoice.grand_total || 0}</span></p>
                <p><strong>In Words:</strong> <span class="value">${invoice.in_words || "N/A"}</span></p>
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
                <div className="d-flex align-items-center mb-2">
                  <img
                    src="/menuIcons/logo for restaurant ilustración de Stock.jpeg"
                    alt="Dine 8 Logo"
                    style={{ width: "80px", height: "80px", marginRight: "10px" }}
                  />
                  <p style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>Dine 8</p>
                </div>
                <p>
                  <strong>Posting Date:</strong>{" "}
                  <span className="value">{formatDate(selectedInvoice.posting_date)}</span>
                </p>
                <p>
                  <strong>Posting Time:</strong>{" "}
                  <span className="value">{formatTime(selectedInvoice.posting_time)}</span>
                </p>
                <p>
                  <strong>Customer Name:</strong>{" "}
                  <span className="value">{selectedInvoice.customer_details?.customer_name || "N/A"}</span>
                </p>
                {selectedInvoice.customer_details?.address && (
                  <p>
                    <strong>Address:</strong>{" "}
                    <span className="value">{selectedInvoice.customer_details.address}</span>
                  </p>
                )}
                <p>
                  <strong>Phone Number:</strong>{" "}
                  <span className="value">{selectedInvoice.customer_details?.mobile_no || "N/A"}</span>
                </p>
              </div>
              <h6>Items:</h6>
              {selectedInvoice.pos_invoice_items && selectedInvoice.pos_invoice_items.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Item Name</th>
                        <th>Description</th>
                        <th className="table-right-align">Quantity</th>
                        <th className="table-right-align">Rate</th>
                        <th className="table-right-align">Amount</th>
                        {/* <th className="table-right-align">Size</th> */}
                        {/* <th className="table-right-align">Varient</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.pos_invoice_items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.item_name || "N/A"}</td>
                          <td>{item.description || "N/A"}</td>
                          <td className="table-right-align">{item.qty || 0}</td>
                          <td className="table-right-align">₹{item.rate || 0}</td>
                          <td className="table-right-align">₹{item.amount || 0}</td>
                          {/* <td className="table-right-align">{item.custom_size_variants}</td> */}
                          {/* <td className="table-right-align">{item.custom_other_variants}</td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No items found</p>
              )}
              {offers.length > 0 && (
                <div className="mb-3">
                  <h6>Special Offers:</h6>
                  {offers.map((offer, idx) => (
                    <p key={idx}>
                      <span className="value">
                        {offer.messages || "N/A"} (Valid: {formatDate(offer.start_date)} to {formatDate(offer.end_date)})
                      </span>
                    </p>
                  ))}
                </div>
              )}
              <div className="mt-3">
                <p>
                  <strong>Total Taxes:</strong>{" "}
                  <span className="value">₹{selectedInvoice.total_taxes_and_charges || 0}</span>
                </p>
                <p>
                  <strong>Discount:</strong>{" "}
                  <span className="value">
                    {formatDiscount(selectedInvoice)} ({selectedInvoice.apply_discount_on || "Grand Total"})
                  </span>
                </p>
                <p>
                  <strong>Currency:</strong>{" "}
                  <span className="value">{selectedInvoice.currency || "INR"}</span>
                </p>
                <p>
                  <strong>Paid Amount:</strong>{" "}
                  <span className="value">₹{selectedInvoice.paid_amount || 0}</span>
                </p>
                <p>
                  <strong>Grand Total:</strong>{" "}
                  <span className="value">₹{selectedInvoice.grand_total || 0}</span>
                </p>
                <p>
                  <strong>In Words:</strong>{" "}
                  <span className="value">{selectedInvoice.in_words || "N/A"}</span>
                </p>
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
            {renderInvoiceTable(part1, "")}
          </div>
          <div className="col-md-4 px-2">
            {renderInvoiceTable(part2, "")}
          </div>
          <div className="col-md-4 px-2">
            {renderInvoiceTable(part3, "")}
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