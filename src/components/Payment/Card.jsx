import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Card() {
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [errors, setErrors] = useState({});
    const [billDetails, setBillDetails] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.billDetails) {
            setBillDetails(location.state.billDetails);
        }
    }, [location]);

    const validateFields = () => {
        let newErrors = {};

        if (!/^\d{16}$/.test(cardNumber)) {
            newErrors.cardNumber = "Enter a valid 16-digit card number.";
        }

        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
            newErrors.expiryDate = "Enter expiry in MM/YY format.";
        }

        if (!/^\d{3}$/.test(cvv)) {
            newErrors.cvv = "Enter a valid 3-digit CVV.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCardSubmit = (e) => {
        e.preventDefault();
        if (validateFields()) {
            alert('Card Payment Confirmed!');
            navigate('/frontpage');
        }
    };

    const handleExpiryDateChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        setExpiryDate(value);
    };

    return (
        <>
        <i className="fi fi-rs-angle-small-left back-button" onClick={() => navigate('/frontpage')}></i>
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-lg-6 col-md-8 col-sm-10">
                        <div className="card shadow-sm border-0 rounded">
                            <div className="card-body p-4">
                                <h3 className="text-center mb-4">Card Payment</h3>

                                {billDetails && (
                                    <div className="mb-4">
                                        <h5>Customer: <strong>{billDetails.customerName}</strong></h5>
                                        <p><strong>Phone:</strong> {billDetails.phoneNumber}</p>
                                        <h6>Items Ordered:</h6>
                                        <ul className="list-group mb-3">
                                            {billDetails.items.map((item, index) => (
                                                <li key={index} className="list-group-item">
                                                    {item.name} - ${item.price} x {item.quantity} = ${item.totalPrice.toFixed(2)}
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
                                        <h4 className="text-center">
                                            <span className="badge bg-primary">Total: ${billDetails.totalAmount.toFixed(2)}</span>
                                        </h4>
                                    </div>
                                )}
                                <form onSubmit={handleCardSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="cardNumber" className="form-label">Card Number</label>
                                        <input
                                            type="text"
                                            id="cardNumber"
                                            className={`form-control ${errors.cardNumber ? "is-invalid" : ""}`}
                                            placeholder="Enter your card number"
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(e.target.value)}
                                            maxLength="16"
                                            required
                                        />
                                        {errors.cardNumber && <div className="invalid-feedback">{errors.cardNumber}</div>}
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label htmlFor="expiryDate" className="form-label">Expiry Date</label>
                                            <input
                                                type="text"
                                                id="expiryDate"
                                                className={`form-control ${errors.expiryDate ? "is-invalid" : ""}`}
                                                placeholder="MM/YY"
                                                value={expiryDate}
                                                onChange={handleExpiryDateChange}
                                                maxLength="5"
                                                required
                                            />
                                            {errors.expiryDate && <div className="invalid-feedback">{errors.expiryDate}</div>}
                                        </div>

                                        <div className="col-md-6">
                                            <label htmlFor="cvv" className="form-label">CVV</label>
                                            <input
                                                type="text"
                                                id="cvv"
                                                className={`form-control ${errors.cvv ? "is-invalid" : ""}`}
                                                placeholder="CVV"
                                                value={cvv}
                                                onChange={(e) => setCvv(e.target.value)}
                                                maxLength="3"
                                                required
                                            />
                                            {errors.cvv && <div className="invalid-feedback">{errors.cvv}</div>}
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <button type="submit" className="btn btn-success w-100 mt-4">
                                            Pay with Card
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Card;
