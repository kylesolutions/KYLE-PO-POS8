import { useState } from "react";

function Design4Cart({ cartItems, updateQuantity }) {
    const [discount, setDiscount] = useState(0);
    const taxRate = 0.08; // 8% tax rate

    const calculateSubtotal = () => {
        return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const subtotal = calculateSubtotal();
    const taxAmount = subtotal * taxRate;
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal + taxAmount - discountAmount;

    const handleDiscountChange = (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value) && value >= 0 && value <= 100) {
            setDiscount(value);
        } else if (e.target.value === '') {
            setDiscount('');
        } else {
            setDiscount(0);
        }
    };
  return (
    <div
            className="container mt-2"
            style={{
                boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px',
                padding: '10px',
                borderRadius: '5px',
                height: '97vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <div className="d-flex justify-content-between align-items-center mt-4">
                <h4>One Time Customer</h4>
                <div style={{ fontSize: '12px' }} className="text-end">
                    <p className="mb-0">T no: 2</p>
                    <p className="mb-0">Chairs: 4</p>
                </div>
            </div>
            <hr />
            <div className="d-flex justify-content-between">
                <p className="mb-0">Order Details:</p>
                <i className="bi bi-three-dots-vertical"></i>
            </div>
            <div
                style={{
                    flex: '1 1 auto',
                    overflowY: 'auto',
                    marginBottom: '10px'
                }}
            >
                {cartItems.map((item) => (
                    <div
                        key={item.id}
                        className="d-flex justify-content-between mt-4 cart-image"
                        style={{
                            boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px',
                            padding: '10px',
                            borderRadius: '5px',
                        }}
                    >
                        <img
                            src={item.image}
                            alt={item.name}
                            style={{ height: '50px', objectFit: 'contain', borderRadius: '5px' }}
                        />
                        <div className="d-flex align-items-center">
                            <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                style={{
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '5px 0 0 5px',
                                    cursor: 'pointer',
                                }}
                            >
                                −
                            </button>
                            <input
                                type="text"
                                value={item.quantity}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (!isNaN(value) && value >= 1) {
                                        updateQuantity(item.id, value);
                                    }
                                }}
                                style={{
                                    width: '40px',
                                    textAlign: 'center',
                                    border: 'none',
                                    background: '#ebebeb6e',
                                    padding: '5px',
                                    borderRadius: '0',
                                }}
                            />
                            <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                style={{
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '0 5px 5px 0',
                                    cursor: 'pointer',
                                }}
                            >
                                +
                            </button>
                        </div>
                        <div className="text-end fw-medium" style={{ fontSize: '15px' }}>
                            <p className="mb-0">{item.name}</p>
                            <p className="mb-0">$ {item.price.toFixed(2)}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="total">
                <div style={{
                    boxShadow: 'rgba(117, 117, 117, 0.24) 0px 3px 8px',
                    padding: '10px',
                    borderRadius: '5px',
                    backgroundColor: "#dfdfdf",
                    color: "#850606"
                }}>
                    <div className="d-flex justify-content-between" style={{ padding: '10px' }}>
                        <p className="mb-0">Subtotal:</p>
                        <p className="mb-0">$ {subtotal.toFixed(2)}</p>
                    </div>
                    <div className="d-flex justify-content-between" style={{ padding: '10px' }}>
                        <p className="mb-0">Tax (8%):</p>
                        <p className="mb-0">$ {taxAmount.toFixed(2)}</p>
                    </div>
                    <div className="d-flex justify-content-between align-items-center" style={{ padding: '10px' }}>
                        <p className="mb-0">Discount (%):</p>
                        <div className="d-flex align-items-center">
                            <input
                                type="text"
                                value={discount}
                                onChange={handleDiscountChange}
                                style={{
                                    width: '50px',
                                    textAlign: 'center',
                                    border: 'none',
                                    background: '#ebebeb6e',
                                    padding: '5px',
                                    borderRadius: '5px',
                                    marginRight: '10px',
                                }}
                            />
                            <p className="mb-0">$ {discountAmount.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <hr />
                <div className="d-flex justify-content-between" style={{ padding: '10px' }}>
                    <p className="mb-0 fw-bold">Total:</p>
                    <p className="mb-0 fw-bold">$ {total.toFixed(2)}</p>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button
                        style={{
                            border: 'none',
                            background: '#cccccc',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: '500',
                        }}
                        onClick={() => window.print()}
                    >
                        Print
                    </button>
                    <button
                        style={{
                            border: 'none',
                            background: '#cccccc',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: '500',
                        }}
                    >
                        Checkout
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Design4Cart