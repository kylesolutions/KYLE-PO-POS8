import './design2Headers.css'

function Design2Headers() {
  const categories = [
        'Beverages',
        'Snacks',
        'Desserts',
        'Main Course',
        'Appetizers'
    ];

    const items = [
        { id: 1, name: 'Coffee', price: 5.99, image: 'images/coffee.png' },
        { id: 2, name: 'Sandwich', price: 7.49, image: 'images/sandwich.png' },
        { id: 3, name: 'Cake', price: 4.99, image: 'images/cake.png' },
        { id: 4, name: 'Pizza', price: 12.99, image: 'images/pizza.png' },
        { id: 5, name: 'Salad', price: 6.99, image: 'images/salad.jpg' },
        { id: 6, name: 'Burger', price: 8.99, image: 'images/burger.png' },
        { id: 7, name: 'Juice', price: 3.99, image: 'images/juice.jpg' },
        { id: 8, name: 'Fries', price: 2.99, image: 'images/fries.png' },
        { id: 9, name: 'Ice Cream', price: 4.49, image: 'images/icecream.jpg' }
    ];

    return (
        <div className="header container-fluid">
            <div className="d-flex justify-content-between mt-5">
                <div className="heading">
                    <h1>Good Morning</h1>
                </div>
                <div className="d-flex justify-content-center align-items-center">
                    <input className="header-input me-3" placeholder="Search..." />
                    <i className="bi bi-person-circle fs-2 me-2"></i>
                    <div>
                        <p className="mb-0">User</p>
                        <p className="mb-0" style={{ fontSize: '10px' }}>Cashier</p>
                    </div>
                </div>
            </div>
            <div className="category-div d-flex justify-content-start mt-5 gap-3">
                {categories.map((category, index) => (
                    <div
                        key={index}
                        className="category-item"
                        style={{
                            backgroundColor: '#f7daa5',
                            borderRadius: '5px',
                            padding: '10px 20px',
                            cursor: 'pointer'
                        }}
                    >
                        {category}
                    </div>
                ))}
            </div>
            <div className="item-div mt-5">
                <div className="row row-cols-1 row-cols-md-4 g-4">
                    {items.map((item) => (
                        <div key={item.id} className="col">
                            <div className="card h-100" style={{
                                boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px',
                                padding: '10px',
                                borderRadius: '5px',
                            }}>
                                <img
                                    src={item.image}
                                    className="card-img-top"
                                    alt={item.name}
                                    style={{ height: '150px', objectFit: 'contain' }}
                                />
                                <div className="card-body">
                                    <h5 className="card-title">{item.name}</h5>
                                    <p className="card-text">${item.price.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Design2Headers