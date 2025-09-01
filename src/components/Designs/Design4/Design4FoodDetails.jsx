import React, { useEffect, useState } from 'react'

function Design4FoodDetails({ selectedItem, addToCart }) {
  const [quantity, setQuantity] = useState(1);

    // Reset quantity to 1 when selectedItem changes
    useEffect(() => {
        setQuantity(1);
    }, [selectedItem]);

    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value >= 1) {
            setQuantity(value);
        }
    };

    const handleAddToCart = () => {
        if (selectedItem) {
            addToCart({ ...selectedItem, quantity });
        }
    };

    return (
        <>
            {selectedItem ? (
                <div className='container-fluid mt-3'>
                    <div className='row'>
                        <div className='col-4' style={{ borderRadius: "10px" }}>
                            <img
                                src={selectedItem.image}
                                alt={selectedItem.name}
                                style={{ width: '100%', height: '300px', borderRadius: "10px" }}
                            />
                        </div>
                        <div className='col-8' style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            justifyContent: "center",
                            padding: "20px"
                        }}>
                            <div className='d-flex flex-column align-items-end' style={{ width: '100%' }}>
                                <h2 style={{ marginBottom: '10px', fontSize: '1.8rem' }}>{selectedItem.name}</h2>
                                <p style={{ color: "#a91919", marginBottom: '10px', fontSize: '1.2rem' }}>
                                    Price: ${selectedItem.price.toFixed(2)}
                                </p>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ marginRight: '10px', fontSize: '1rem' }}>Quantity: </label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        min={1}
                                        onChange={handleQuantityChange}
                                        style={{
                                            width: '60px',
                                            padding: '5px',
                                            borderRadius: '5px',
                                            border: '1px solid #ccc'
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    style={{
                                        backgroundColor: '#a91919',
                                        color: 'white',
                                        padding: '10px 20px',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontWeight: '500',
                                        fontSize: '1rem'
                                    }}
                                >
                                    ADD TO CART
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <></>
            )}
        </>
    );
}

export default Design4FoodDetails;