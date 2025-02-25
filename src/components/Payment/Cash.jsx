import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Cash() {
    const location = useLocation();
    const [billDetails, setBillDetails] = useState(null);
    const [cashGiven, setCashGiven] = useState("");
    const [change, setChange] = useState(0);
    const [vatRate, setVatRate] = useState(10); 
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state) {
            setBillDetails(location.state.billDetails);
        }
    }, [location]);

    const calculateVAT = () => {
        return billDetails ? (billDetails.totalAmount * vatRate) / 100 : 0;
    };

    const calculateGrandTotal = () => {
        return billDetails ? billDetails.totalAmount + calculateVAT() : 0;
    };

    const handleCashChange = (e) => {
        const givenAmount = parseFloat(e.target.value);
        setCashGiven(e.target.value);

        if (billDetails && givenAmount >= calculateGrandTotal()) {
            setChange(givenAmount - calculateGrandTotal());
        } else {
            setChange(0);
        }
    };

    return (
        <>
            <i className="fi fi-rs-angle-small-left back-button" onClick={() => navigate("/frontpage")}></i>
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-lg-6 col-md-8 col-sm-10">
                        <div className="card shadow-sm border-0 rounded">
                            <div className="card-body p-4">
                                <h3 className="text-center mb-4">Cash Payment Bill</h3>

                                {billDetails ? (
                                    <div>
                                        <h5>
                                            Customer: <strong>{billDetails.customerName}</strong>
                                        </h5>
                                        <p>
                                            <strong>Phone Number:</strong> {billDetails.phoneNumber}
                                        </p>

                                        <h6>Items Ordered:</h6>
                                        <ul className="list-group mb-4">
                                            {billDetails.items.map((item, index) => (
                                                <li key={index} className="list-group-item">
                                                    <strong>{item.name}</strong> - ₹{item.price} x {item.quantity} = ₹{item.totalPrice.toFixed(2)}

                                                    {item.addonCounts && Object.keys(item.addonCounts).length > 0 && (
                                                        <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#888" }}>
                                                            {Object.entries(item.addonCounts).map(([addonName, addonPrice]) => (
                                                                <li key={addonName}>+ {addonName} (₹{addonPrice})</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    {item.selectedCombos && item.selectedCombos.length > 0 && (
                                                        <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#555" }}>
                                                            {item.selectedCombos.map((combo, idx) => (
                                                                <li key={idx}>+ {combo.name1} ({combo.size}) - ₹{combo.price}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="tax-section">
                                            <div className="row">
                                                <div className="col-6 text-start"><strong>Subtotal:</strong></div>
                                                <div className="col-6 text-end">₹{billDetails.totalAmount.toFixed(2)}</div>

                                                <div className="col-6 text-start"><strong>VAT ({vatRate}%):</strong></div>
                                                <div className="col-6 text-end">₹{calculateVAT().toFixed(2)}</div>

                                                <div className="col-6 text-start"><strong>Grand Total:</strong></div>
                                                <div className="col-6 text-end"><strong>₹{calculateGrandTotal().toFixed(2)}</strong></div>
                                            </div>
                                        </div>

                                        <div className="mb-3 mt-3">
                                            <label className="form-label">Enter Cash Given by Customer:</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                placeholder="Enter amount"
                                                value={cashGiven}
                                                onChange={handleCashChange}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Return Change:</label>
                                            <h5 className="text-danger">₹ {change.toFixed(2)}</h5>
                                        </div>

                                        <div className="text-center">
                                            <button
                                                className="btn btn-success w-100"
                                                onClick={() => {
                                                    if (cashGiven >= calculateGrandTotal()) {
                                                        alert("Payment confirmed!");
                                                        navigate("/frontpage");
                                                    } else {
                                                        alert("Insufficient cash amount!");
                                                    }
                                                }}
                                            >
                                                Confirm Cash Payment
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p>Loading...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Cash;
