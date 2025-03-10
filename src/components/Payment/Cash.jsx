import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import './cash.css';

function Cash() {
    const location = useLocation();
    const navigate = useNavigate();
    const [billDetails, setBillDetails] = useState(null);
    const [cashGiven, setCashGiven] = useState("");
    const [change, setChange] = useState(0);

    useEffect(() => {
        if (location.state && location.state.billDetails) {
            setBillDetails(location.state.billDetails);
        }
    }, [location]);

    const handleCashChange = (e) => {
        const givenAmount = parseFloat(e.target.value) || 0;
        setCashGiven(e.target.value);

        if (billDetails) {
            const totalAmount = parseFloat(billDetails.totalAmount);
            setChange(givenAmount - totalAmount); // Change can be negative if insufficient
        }
    };

    const handleConfirmPayment = () => {
        alert('Payment confirmed!');
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
                                                Customer: <span className="text-primary">{billDetails.customerName}</span>
                                            </h5>
                                            <p className="mb-0">
                                                <strong>Phone:</strong> {billDetails.phoneNumber || "N/A"}
                                            </p>
                                        </div>

                                        <h6 className="fw-bold mb-3">Items Ordered:</h6>
                                        <div className="items-list mb-4">
                                            {billDetails.items.map((item, index) => (
                                                <div key={index} className="item-card p-3 mb-2 rounded shadow-sm">
                                                    <div className="d-flex justify-content-between">
                                                        <strong>{item.name}</strong>
                                                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                    <small className="text-muted">
                                                        ₹{item.price} x {item.quantity}
                                                    </small>
                                                    {item.addonCounts && Object.keys(item.addonCounts).length > 0 && (
                                                        <ul className="addon-list mt-2">
                                                            {Object.entries(item.addonCounts).map(([addonName, { price, quantity }]) => (
                                                                <li key={addonName}>
                                                                    + {addonName} x{quantity} (₹{(price * quantity).toFixed(2)})
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    {item.selectedCombos && item.selectedCombos.length > 0 && (
                                                        <ul className="combo-list mt-2">
                                                            {item.selectedCombos.map((combo, idx) => (
                                                                <li key={idx}>
                                                                    + {combo.name1} x{combo.quantity || 1}
                                                                    {combo.selectedVariant ? ` (${combo.selectedVariant})` : ''} 
                                                                    - ₹{(((combo.combo_price || 0) + (combo.variantPrice || 0)) * (combo.quantity || 1)).toFixed(2)}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    <div className="item-total mt-2 fw-bold">
                                                        Total: ₹{item.totalPrice.toFixed(2)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="totals-section mb-4 p-3 bg-light rounded">
                                            <div className="row">
                                                <div className="col-6 text-start">Subtotal:</div>
                                                <div className="col-6 text-end">₹{parseFloat(billDetails.subTotal).toFixed(2)}</div>
                                                <div className="col-6 text-start">VAT ({billDetails.vatRate}%):</div>
                                                <div className="col-6 text-end">₹{parseFloat(billDetails.vatAmount).toFixed(2)}</div>
                                                <div className="col-6 text-start fw-bold">Grand Total:</div>
                                                <div className="col-6 text-end fw-bold">₹{parseFloat(billDetails.totalAmount).toFixed(2)}</div>
                                            </div>
                                        </div>

                                        <div className="payment-section">
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Cash Given by Customer:</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    placeholder="Enter amount (₹)"
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