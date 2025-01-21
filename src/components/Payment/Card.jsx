import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

function Card() {
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const navigate = useNavigate()
    
    const handleCardSubmit = (e) => {
        e.preventDefault();
        alert('Card Payment Confirmed!');
        navigate('/frontpage'); 
    };

    return (
        <>
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-lg-6 col-md-8 col-sm-10">
                        <div className="card shadow-sm border-0 rounded">
                            <div className="card-body p-4">
                                <h3 className="text-center mb-4">Card Payment</h3>
                                <form onSubmit={handleCardSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="cardNumber" className="form-label">Card Number</label>
                                        <input
                                            type="text"
                                            id="cardNumber"
                                            className="form-control"
                                            placeholder="Enter your card number"
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label htmlFor="expiryDate" className="form-label">Expiry Date</label>
                                            <input
                                                type="text"
                                                id="expiryDate"
                                                className="form-control"
                                                placeholder="MM/YY"
                                                value={expiryDate}
                                                onChange={(e) => setExpiryDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="cvv" className="form-label">CVV</label>
                                            <input
                                                type="text"
                                                id="cvv"
                                                className="form-control"
                                                placeholder="CVV"
                                                value={cvv}
                                                onChange={(e) => setCvv(e.target.value)}
                                                required
                                            />
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
