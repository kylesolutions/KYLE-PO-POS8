import React, { useEffect, useState } from "react";

function SalesInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch POS invoices function
  const fetchInvoices = async () => {
    setLoading(true);
    setError(""); // Reset any previous errors
  
    try {
      const response = await fetch(
        `http://109.199.100.136:6060/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoice`
      );
      const data = await response.json();
  
      console.log("API Response Data:", data); // Log the response data
  
      if (data.status === "success") {
        setInvoices(data.message.invoice); // Ensure you're setting the right part of the data
      } else {
        setError(data.message || "Failed to fetch POS Invoices.");
      }
    } catch (err) {
      setError("An error occurred while fetching the POS invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <div className="container mt-4">
      <h3>POS Invoices</h3>
  
      {loading && <p>Loading...</p>}
      {error && <div className="alert alert-danger">{error}</div>}
  
      {invoices && invoices.length > 0 ? (
        invoices.map((invoice, index) => (
          <div key={index} className="card mb-3 p-3">
            <h4>Invoice: {invoice.name}</h4>
            <p><strong>Customer:</strong> {invoice.customer}</p>
            <p><strong>Posting Date:</strong> {invoice.posting_date}</p>
            <p><strong>Grand Total:</strong> ₹{invoice.grand_total}</p>
            <p><strong>Total Taxes and Charges:</strong> ₹{invoice.total_taxes_and_charges}</p>
            <p><strong>Currency:</strong> {invoice.currency}</p>
            <p><strong>Paid Amount:</strong> ₹{invoice.paid_amount}</p>
  
            <h5 className="mt-3">Items</h5>
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
                {invoice.pos_invoice_items && invoice.pos_invoice_items.length > 0 ? (
                  invoice.pos_invoice_items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.item_name}</td>
                      <td>{item.description}</td>
                      <td>{item.qty}</td>
                      <td>{item.rate}</td>
                      <td>{item.amount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No items found for this invoice.</td>
                  </tr>
                )}
              </tbody>
            </table>
            {invoice.pos_invoice_items && invoice.pos_invoice_items.map((item, idx) => (
              <div key={idx}>
                {item.addons && item.addons.length > 0 && (
                  <div>
                    <strong>Addon(s):</strong>
                    <ul>
                      {item.addons.map((addon, i) => (
                        <li key={i}>{addon.addon_name} - ₹{addon.addon_price}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.combos && item.combos.length > 0 && (
                  <div>
                    <strong>Combo(s):</strong>
                    <ul>
                      {item.combos.map((combo, i) => (
                        <li key={i}>{combo.combo_name} - ₹{combo.combo_price}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))
      ) : (
        <p>No POS Invoices Found</p>
      )}
    </div>
  );
}
export default SalesInvoice;
