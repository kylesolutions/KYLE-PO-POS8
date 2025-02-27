import React, { useEffect, useState } from "react";

function SalesInvoice() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchDate, setSearchDate] = useState(""); // State for search input

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const response = await fetch(
                    `http://109.199.100.136:6060/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_sales_invoice_details_id`
                );
                const data = await response.json();

                if (data.message) {
                    setInvoices(data.message);
                }
            } catch (error) {
                console.error("Error fetching invoices:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
    }, []);

    const filteredInvoices = invoices.filter((invoice) =>
        invoice.posting_date.includes(searchDate)
    );

    if (loading) return <p>Loading...</p>;
    if (invoices.length === 0) return <p>No Invoices Found</p>;

    return (
        <div className="container mt-4">
            <h3>Sales Invoices</h3>

            <div className="mb-3">
                <input
                    type="date"
                    className="form-control"
                    placeholder="Search by Posting Date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                />
            </div>

            {filteredInvoices.length === 0 ? (
                <p>No Invoices Found for the Selected Date</p>
            ) : (
                filteredInvoices.map((invoice, index) => (
                    <div key={index} className="card mb-3 p-3">
                        <h4>Invoice: {invoice.name}</h4>
                        <p><strong>Customer:</strong> {invoice.customer_name}</p>
                        <p><strong>Company:</strong> {invoice.company}</p>
                        <p><strong>Posting Date:</strong> {invoice.posting_date}</p>
                        <p><strong>Due Date:</strong> {invoice.due_date}</p>
                        <p><strong>Currency:</strong> {invoice.currency}</p>
                        <p><strong>Grand Total:</strong> {invoice.grand_total} {invoice.currency}</p>

                        <h5 className="mt-3">Items</h5>
                        <table className="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>Quantity</th>
                                    <th>Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.sales_items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.item_name}</td>
                                        {item.addonCounts && Object.keys(item.addonCounts).length > 0 && (
                                            <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#888" }}>
                                                {Object.entries(item.addonCounts).map(([addonName, addonPrice]) => (
                                                    <li key={addonName}>+ {addonName} (${addonPrice})</li>
                                                ))}
                                            </ul>
                                        )}

                                        {item.selectedCombos && item.selectedCombos.length > 0 && (
                                            <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#555" }}>
                                                {item.selectedCombos.map((combo, idx) => (
                                                    <li key={idx}>+ {combo.name1} ({combo.size}) - ${combo.price}</li>
                                                ))}
                                            </ul>
                                        )}
                                        <td>{item.qty}</td>
                                        <td>{item.rate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))
            )}
        </div>
    );
}

export default SalesInvoice;
