import React from 'react'

function Design4Headers({ setSelectedItem }) {
  const categories = [
        'Beverages',
        'Snacks',
        'Desserts',
        'Main Course',
        'Appetizers'
    ];

    const items = [
        { id: 1, name: 'Coffee', price: 20, image: 'images/Coffee copy.png' },
        { id: 2, name: 'Biriyani', price: 150, image: 'images/biriyani.png' },
        { id: 3, name: 'Burger', price: 140, image: 'images/burger.png' },
        { id: 4, name: 'Pizza', price: 12.99, image: 'images/pizza.png' },
        { id: 5, name: 'Salad', price: 6.99, image: 'images/salad.png' },
        { id: 6, name: 'Orange Juice', price: 8.99, image: 'images/orange juice.png' },
        { id: 7, name: 'Tea', price: 4.49, image: 'images/tea.png' },
        { id: 8, name: 'Fries', price: 2.99, image: 'images/fries.png' },
        { id: 9, name: 'Fried Chicken', price: 4.49, image: 'images/fried.png' },
    ];

    return (
        <>
            <div className="header container-fluid mt-5">
                <div className="category-div d-flex justify-content-start gap-3">
                    {categories.map((category, index) => (
                        <div
                            key={index}
                            className="category-item"
                            style={{
                                backgroundColor: 'white',
                                boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px',
                                borderRadius: '5px',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                color: "#a91919"
                            }}
                        >
                            {category}
                        </div>
                    ))}
                </div>
                <div className="item-div mt-5">
                    <div className="row row-cols-1 row-cols-md-4 g-4">
                        {items.map((item) => (
                            <div key={item.id} className="col-xl-3 col-lg-4 col-md-6 col-12">
                                <div
                                    className="card h-100"
                                    style={{
                                        boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px',
                                        padding: '10px',
                                        borderRadius: '5px',
                                        backgroundColor: "white",
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setSelectedItem(item)}
                                >
                                    <img
                                        src={item.image}
                                        className="card-img-top"
                                        alt={item.name}
                                        style={{
                                            height: '150px',
                                            objectFit: "cover",
                                            boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px',
                                            borderRadius: "10px"
                                        }}
                                    />
                                    <div className="card-body">
                                        <h5 className="card-title">{item.name}</h5>
                                        <p className="card-text" style={{ color: "#a91919" }}>
                                            ${item.price.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Design4Headers