import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import './cash.css';

function Cash() {
    const location = useLocation();
    const navigate = useNavigate();
    const [billDetails, setBillDetails] = useState(null);
    const [cashGiven, setCashGiven] = useState(""); // Optional field
    const [change, setChange] = useState(0);

    useEffect(() => {
        if (location.state?.billDetails) {
            setBillDetails(location.state.billDetails);
            console.log("Bill Details in Cash.jsx:", location.state.billDetails); // Debug log
        } else {
            console.warn("No billDetails received in Cash.jsx");
        }
    }, [location]);

    const handleCashChange = (e) => {
        const givenAmount = parseFloat(e.target.value) || 0;
        setCashGiven(e.target.value);

        if (billDetails) {
            const totalAmount = parseFloat(billDetails.grand_total) || 0;
            setChange(givenAmount - totalAmount);
        }
    };

    const handleConfirmPayment = () => {
        if (!billDetails) {
            alert("No bill details available.");
            return;
        }

        const grandTotal = parseFloat(billDetails.grand_total) || 0;
        const cash = cashGiven ? parseFloat(cashGiven) || 0 : grandTotal; // Default to grandTotal if cashGiven is empty

        // If cashGiven is provided, validate it
        if (cashGiven && cash < grandTotal) {
            alert("Cash given is less than the grand total!");
            return;
        }

        // Calculate change only if cashGiven is provided, otherwise assume exact amount
        const calculatedChange = cashGiven ? (cash - grandTotal) : 0;

        alert(`Payment confirmed! Change: ₹${calculatedChange.toFixed(2)}`);
        navigate("/frontpage");
    };

    return (
        <div className="cash-container">
            <i 
                className="bi bi-arrow-left-circle-fill back-button" 
                onClick={() => navigate("/frontpage")} 
                title="Back to Frontpage"
            ></i>
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-lg-6 col-md-8 col-sm-10">
                        <div className="card shadow-lg border-0 rounded-3">
                            <div className="card-header bg-primary text-white text-center py-3">
                                <h3 className="mb-0">Cash Payment</h3>
                            </div>
                            <div className="card-body p-4">
                                {billDetails ? (
                                    <div>
                                        <div className="customer-info mb-4">
                                            <h5 className="fw-bold">
                                                Customer: <span className="text-primary">{billDetails.customer || "N/A"}</span>
                                            </h5>
                                            <p className="mb-0">
                                                <strong>Phone:</strong> {billDetails.contact_mobile || "N/A"}
                                            </p>
                                            {billDetails.custom_table_number && (
                                                <p className="mb-0">
                                                    <strong>Table No:</strong> {billDetails.custom_table_number}
                                                </p>
                                            )}
                                            {billDetails.custom_delivery_type && billDetails.custom_delivery_type !== "DINE IN" && (
                                                <>
                                                    <p className="mb-0">
                                                        <strong>Delivery Type:</strong> {billDetails.custom_delivery_type}
                                                    </p>
                                                    <p className="mb-0">
                                                        <strong>Address:</strong> {billDetails.customer_address || "N/A"}
                                                    </p>
                                                </>
                                            )}
                                        </div>

                                        <h6 className="fw-bold mb-3">Items Ordered:</h6>
                                        <div className="items-list mb-4">
                                            {billDetails.items && billDetails.items.length > 0 ? (
                                                billDetails.items.map((item, index) => (
                                                    <div key={index} className="item-card p-3 mb-2 rounded shadow-sm">
                                                        <div className="d-flex justify-content-between">
                                                            <strong>{item.item_name || "Unnamed Item"}</strong>
                                                            <span>₹{(parseFloat(item.amount) || (parseFloat(item.rate) * item.qty)).toFixed(2)}</span>
                                                        </div>
                                                        <small className="text-muted">
                                                            ₹{(parseFloat(item.rate) || 0).toFixed(2)} x {item.qty || 1}
                                                        </small>
                                                        {(item.custom_size_variants || item.custom_other_variants) && (
                                                            <ul className="addon-list mt-2">
                                                                {item.custom_size_variants && <li>Size: {item.custom_size_variants}</li>}
                                                                {item.custom_other_variants && <li>Variant: {item.custom_other_variants}</li>}
                                                            </ul>
                                                        )}
                                                        <div className="item-total mt-2 fw-bold">
                                                            Total: ₹{(parseFloat(item.amount) || (parseFloat(item.rate) * item.qty) || 0).toFixed(2)}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p>No items available for this invoice.</p>
                                            )}
                                        </div>

                                        <div className="totals-section mb-4 p-3 bg-light rounded">
                                            <div className="row">
                                                <div className="col-6 text-start">Subtotal:</div>
                                                <div className="col-6 text-end">₹{(parseFloat(billDetails.total) || 0).toFixed(2)}</div>
                                                <div className="col-6 text-start">VAT ({((parseFloat(billDetails.grand_total) - parseFloat(billDetails.total)) / parseFloat(billDetails.total) * 100 || 0).toFixed(2)}%):</div>
                                                <div className="col-6 text-end">₹{((parseFloat(billDetails.grand_total) - parseFloat(billDetails.total)) || 0).toFixed(2)}</div>
                                                <div className="col-6 text-start fw-bold">Grand Total:</div>
                                                <div className="col-6 text-end fw-bold">₹{(parseFloat(billDetails.grand_total) || 0).toFixed(2)}</div>
                                            </div>
                                        </div>

                                        <div className="payment-section">
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Cash Given by Customer (Optional):</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    placeholder="Enter amount if change needed (₹)"
                                                    value={cashGiven}
                                                    onChange={handleCashChange}
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label className="form-label fw-bold">Return Change:</label>
                                                <h5 className={`fw-bold ${change >= 0 ? 'text-success' : 'text-danger'}`}>
                                                    ₹ {change.toFixed(2)}
                                                </h5>
                                            </div>

                                            <button
                                                className="btn btn-success w-100 py-2"
                                                onClick={handleConfirmPayment}
                                            >
                                                Confirm Payment
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="bi bi-exclamation-circle text-warning fs-1"></i>
                                        <p className="mt-3">No bill details available.</p>
                                        <button className="btn btn-outline-primary" onClick={() => navigate("/frontpage")}>
                                            Back to Frontpage
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Cash;