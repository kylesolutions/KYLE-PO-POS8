import React, { useEffect, useState } from "react";

function SalesInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInvoices = async () => {
    setLoading(true);
    setError(""); // Reset error state

    try {
      const response = await fetch(
        "http://109.199.100.136:6060/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoice"
      );
      const data = await response.json();

      console.log("Full API Response:", data);

      // Check the response structure and set invoices accordingly
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

  // Render function with better error handling
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

    return invoices.map((invoice, index) => (
      <div key={invoice.name || index} className="card mb-3 p-3">
        <h4>Invoice: {invoice.name}</h4>
        <div className="row">
          <div className="col-md-6">
            <p><strong>Customer:</strong> {invoice.customer || "N/A"}</p>
            <p><strong>Posting Date:</strong> {invoice.posting_date || "N/A"}</p>
            <p><strong>Grand Total:</strong> ₹{invoice.grand_total || 0}</p>
          </div>
          <div className="col-md-6">
            <p><strong>Total Taxes:</strong> ₹{invoice.total_taxes_and_charges || 0}</p>
            <p><strong>Currency:</strong> {invoice.currency || "INR"}</p>
            <p><strong>Paid Amount:</strong> ₹{invoice.paid_amount || 0}</p>
          </div>
        </div>

        {/* Items Table */}
        <h5 className="mt-3">Items</h5>
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="thead-dark">
              <tr>
                <th>Item Name</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.pos_invoice_items && invoice.pos_invoice_items.length > 0 ? (
                invoice.pos_invoice_items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.item_name || "N/A"}</td>
                    <td>{item.description || "N/A"}</td>
                    <td>{item.qty || 0}</td>
                    <td>₹{item.rate || 0}</td>
                    <td>₹{item.amount || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">
                    No items found for this invoice
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    ));
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-4">POS Invoices</h3>
      {renderContent()}
    </div>
  );
}

export default SalesInvoice;