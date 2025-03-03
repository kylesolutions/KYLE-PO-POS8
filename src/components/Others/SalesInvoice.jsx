import React, { useEffect, useState } from "react";

function SalesInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterId, setFilterId] = useState(""); // State for filtering by invoice ID

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

  // Filter invoices based on invoice ID (name)
  const filteredInvoices = invoices.filter((invoice) =>
    invoice.name.toLowerCase().includes(filterId.toLowerCase())
  );

  // Handle filter input change
  const handleFilterChange = (e) => {
    setFilterId(e.target.value);
  };

  // Render function with table and filter
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
        {/* Filter Input */}
        <div className="mb-4">
          <label htmlFor="filterId" className="form-label">
            Filter by Invoice ID:
          </label>
          <input
            type="text"
            id="filterId"
            className="form-control w-25"
            value={filterId}
            onChange={handleFilterChange}
            placeholder="Enter Invoice ID (e.g., POSINV-001)"
          />
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center">
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