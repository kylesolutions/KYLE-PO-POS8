import React, { useContext, useEffect, useState } from 'react'
import UserContext from '../../Context/UserContext';
import './front.css'
import { useLocation, useNavigate } from 'react-router-dom';
import FoodDetails from './FoodDetails';
import { v4 as uuidv4 } from 'uuid';
import SavedOrder from './SavedOrder';

function Front() {
    const [menuItems, setMenuItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [categories, setCategories] = useState([]);
    const [showButtons, setShowButtons] = useState(false);
    const { cartItems, addToCart, removeFromCart, updateCartItem, setCartItems,totalPrice } = useContext(UserContext);
    const location = useLocation();
    const { state } = useLocation();
    const { tableNumber, existingOrder, tables } = state || {};
    const [savedOrders, setSavedOrders] = useState([]);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isPhoneNumberSet, setIsPhoneNumberSet] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [customerName, setCustomerName] = useState("One Time Customer");
    const [newCustomerName, setNewCustomerName] = useState("");
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate()
    const [bookedTables, setBookedTables] = useState([]);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_kyle_item_details', {
                    method: 'GET',
                    headers: {
                        Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
                        'Content-Type': 'application/json',
                    },
                });
    
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const data = await response.json();
                console.log('API Response:', data);
    
                if (data && Array.isArray(data.message)) {
                    const baseUrl = 'http://109.199.100.136:6060/';
                    const formattedItems = data.message.map((item) => ({
                        id: uuidv4(),
                        name: item.item_name,
                        category: item.item_group,
                        image: item.image ? `${baseUrl}${item.image}` : 'default-image.jpg',
                        price: item.price_list_rate || 0, 
                        addons: item.addons || [],
                        combos: item.combos || [],
                        ingredients: item.ingredients || []
                    }));
    
                    setMenuItems(formattedItems);
                    setFilteredItems(formattedItems);
    
                    const uniqueCategories = [
                        ...new Set(formattedItems.map((item) => item.category.toLowerCase())),
                    ];
                    setCategories(uniqueCategories);
                } else {
                    throw new Error('Invalid data structure or missing message array');
                }
            } catch (error) {
                console.error('Error fetching items:', error);
            }
        };
    
        fetchItems();
    }, []);
    


    const handlePhoneNumberChange = (e) => {
        setPhoneNumber(e.target.value);
    };

    const handleSetPhoneNumber = () => {
        if (phoneNumber.trim() === "") {
            alert("Please enter a valid phone number.");
            return;
        }
        setIsPhoneNumberSet(true);
    };

    const handleFilter = (category) => {
        const filtered = menuItems.filter((item) =>
            item.category.toLowerCase() === category.toLowerCase()
        );
        setFilteredItems(filtered);
        setSelectedCategory(category);
    };

    const handleItemClick = (item) => setSelectedItem(item);

    const handleItemUpdate = (updatedItem) => {
        updateCartItem(updatedItem);
        setSelectedItem(null);
    };
    const cartTotal = () => {
        return cartItems.reduce((sum, item) => {
            const price = item.totalPrice || 0;
            const quantity = item.quantity || 1;
            return sum + price * quantity;
        }, 0).toFixed(2);
    };

    const handleCheckoutClick = () => {
        setShowButtons(true);
    };

    const increaseQuantity = (item) => {
        setCartItems(prevItems =>
            prevItems.map(cartItem =>
                cartItem.id === item.id
                    ? { ...cartItem, quantity: cartItem.quantity + 1 }
                    : cartItem
            )
        );
    };

    const decreaseQuantity = (item) => {
        setCartItems(prevItems =>
            prevItems.map(cartItem =>
                cartItem.id === item.id && cartItem.quantity > 1
                    ? { ...cartItem, quantity: cartItem.quantity - 1 }
                    : cartItem
            )
        );
    };

    const handleNavigation = () => {
        if (tableNumber) {
            navigate('/kitchen', { state: { tableNumber, customerName } });
        } else {
            alert("No table selected.");
        }
    }

    const handlePaymentSelection = async (method) => {
        const paymentDetails = {
            mode_of_payment: method,
            amount: parseFloat(cartTotal()).toFixed(2),
        };
   
        console.log("Payment Details:", paymentDetails);
   
        const billDetails = {
            customerName: customerName,
            phoneNumber: phoneNumber || "N/A",
            items: cartItems.map((item) => ({
                name: item.name,
                price: item.basePrice,
                quantity: item.quantity,
                totalPrice: item.basePrice * item.quantity,
            })),
            totalAmount: cartTotal(),
            payments: [paymentDetails], 
        };
   
        try {
            if (method === "CASH") {
                navigate("/cash", { state: { billDetails } });
                await handleSaveToBackend(paymentDetails);
                handlePaymentCompletion(tableNumber);
            } else if (method === "CARD") {
                navigate("/card", { state: { billDetails } });
                await handleSaveToBackend(paymentDetails);
                handlePaymentCompletion(tableNumber);
            } else if (method === "UPI") {
                alert("Redirecting to UPI payment... Please complete the payment in your UPI app.");
                await handleSaveToBackend(paymentDetails);
                handlePaymentCompletion(tableNumber);
            }
        } catch (error) {
            console.error("Error processing payment:", error);
            alert("Failed to process payment. Please try again.");
        }
    };

    const handlePaymentCompletion = (tableNumber) => {
        const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
        const updatedOrders = savedOrders.filter(order => order.tableNumber !== tableNumber);
        localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
        const updatedBookedTables = bookedTables.filter(table => table !== tableNumber);
        setBookedTables(updatedBookedTables);
        localStorage.setItem("bookedTables", JSON.stringify(updatedBookedTables));
        setCartItems([]);
        alert(`Payment for Table ${tableNumber} is completed. The table is now available.`);
    };

    const handleSaveToBackend = async (paymentDetails) => {
        if (cartItems.length === 0) {
            alert("Cart is empty. Please add items before saving.");
            return;
        }
    
        const validItems = cartItems.filter(item => item.quantity > 0);
        if (validItems.length !== cartItems.length) {
            alert("All items must have a quantity greater than zero.");
            return;
        }
    
        const payload = {
            customer: customerName,
            items: validItems.map(item => ({
                item_name: item.name,
                basePrice: item.basePrice,
                quantity: item.quantity,
                amount: item.basePrice * item.quantity,
            })),
            total: parseFloat(cartTotal()).toFixed(2),
            payment_terms: [
                {
                    due_date: "2024-02-01",
                    payment_terms: "test",
                },
            ],
            payments: [paymentDetails],
        };
        console.log("Final Payload before sending to backend:", payload); 
    
        try {
            const response = await fetch(
                "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.create_sales_invoice",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                    },
                    body: JSON.stringify(payload),
                }
            );
    
            const result = await response.json();
    
            if (result.status === "success") {
                alert("Cart saved to backend successfully!");
                setCartItems([]);
                localStorage.removeItem("savedOrders");
            } else {
                // alert(result.message || "Failed to save cart. Please try again.");
            }
        } catch (error) {
            console.error("Network or Request Error:", error);
            alert("A network error occurred. Please check your connection and try again.");
        }
    };

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_customers', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
                    },
                });
                const data = await response.json();
                console.log("Raw API Response:", data);
                if (Array.isArray(data)) {
                    setCustomers(data);
                } else if (data.message && Array.isArray(data.message)) {

                    setCustomers(data.message);
                } else {
                    console.error("Unexpected response format:", data);
                }
            } catch (error) {
                console.error("Network error:", error);
            }
        };
        fetchCustomers();
    }, []);

    const handleCreateCustomer = async () => {
        if (!newCustomerName.trim()) {
            alert("Customer name is required.");
            return;
        }
        try {
            const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.create_customer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
                },
                body: JSON.stringify({ customer_name: newCustomerName.trim() }),
            });

            if (!response.ok) {
                const errorDetails = await response.json();
                console.error("API Error:", errorDetails);
                alert(`Error: ${errorDetails.message || response.statusText}`);
                return;
            }
            const data = await response.json();
            if (data.status === "success") {
                alert("Customer creation done successfully");
                const newCustomer = { customer_name: newCustomerName.trim() };
                setCustomers((prev) => [...prev, newCustomer]);
                setCustomerName(newCustomerName.trim());
                setNewCustomerName("");
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Error creating customer:", error);
            alert("Failed to create customer. Please try again.");
        }
    };


    useEffect(() => {
        const saved = localStorage.getItem("savedOrders");
        if (saved) {
            setSavedOrders(JSON.parse(saved));
        }
    }, []);

    const saveOrder = () => {
        if (!customerName || cartItems.length === 0) {
            alert("Please select a customer and add items to the cart.");
            return;
        }

        const newOrder = {
            customerName,
            tableNumber,
            phoneNumber,
            cartItems,
            timestamp: new Date().toISOString(),
        };

        setSavedOrders((prev) => {
            const existingOrders = prev.filter((order) => order.tableNumber !== tableNumber);
            const updatedOrders = [...existingOrders, newOrder];
            localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
            return updatedOrders;
        });

        alert(`Order for Table ${tableNumber} saved successfully!`);
    };

    return (
        <>
            <div className="container-fluid">
                <div className="row">
                    <div className="col-lg-1">
                        <div className="row p-2">
                            {categories.map((category, index) => (
                                <div key={index} className="col-lg-12 mb-2">
                                    <button
                                        className={`text-dark w-100 rounded d-flex align-items-center justify-content-center ${selectedCategory === category ? 'active-category' : ''
                                            }`}
                                        onClick={() => handleFilter(category)}
                                    >
                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="col-lg-7 row2">
                        <div className="row">
                            {filteredItems.map((item, index) => (
                                <div className="col-lg-3 col-md-4 col-6 align-items-center my-2" key={index}>
                                    <div className="card" onClick={() => handleItemClick(item)}>
                                        <img
                                            className="card-img-top"
                                            src={item.image}
                                            alt={item.name}
                                            width={100}
                                            height={100}
                                        />
                                        <div className="card-body p-2 mb-0 category-name">
                                            <h4 className="card-title fs-6 text-center mb-0">{item.name}</h4>
                                            {/* <h4 className="card-title fs-6 text-center mb-0">{item.price}</h4> */}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="col-lg-4 row1">
                        <div className="row p-2">
                            <div className="col-12 p-5 bg-white shadow-sm rounded mb-3">
                                <h1 className="text-center display-4 mb-2">{tableNumber}</h1>
                                <h2 className="text-center text-dark">BILLING</h2>
                                <div className="text-center mt-4">
                                    <div>
                                        <div className="d-flex justify-content-center align-items-center mb-4">
                                            <label
                                                htmlFor="customer-select"
                                                style={{
                                                    marginRight: "10px",
                                                    fontWeight: "bold",
                                                    fontSize: "1rem",
                                                    color: "#555",
                                                }}
                                            >
                                                Customer:
                                            </label>
                                            <select
                                                id="customer-select"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                style={{
                                                    width: "300px",
                                                    padding: "10px",
                                                    border: "1px solid #ccc",
                                                    borderRadius: "5px",
                                                    fontSize: "1rem",
                                                }}
                                            >
                                                <option value="One Time Customer">One Time Customer</option>
                                                {customers.map((customer, index) => (
                                                    <option key={index} value={customer.customer_name}>
                                                        {customer.customer_name}
                                                    </option>
                                                ))}
                                            </select>

                                            <button
                                                className="btn ms-3"
                                                onClick={() => setShowModal(true)}
                                                style={{ fontSize: "1.5rem", fontWeight: "bold", backgroundColor: "ButtonShadow" }}
                                            >
                                                +
                                            </button>
                                        </div>

                                        {showModal && (
                                            <div
                                                className="modal fade show d-block"
                                                tabIndex="-1"
                                                role="dialog"
                                                aria-labelledby="customerModalLabel"
                                                aria-hidden="true"
                                                style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                                            >
                                                <div className="modal-dialog" role="document">
                                                    <div className="modal-content">
                                                        <div className="modal-header">
                                                            <h5 className="modal-title" id="customerModalLabel">
                                                                Create New Customer
                                                            </h5>
                                                            <button
                                                                type="button"
                                                                className="btn-close"
                                                                onClick={() => setShowModal(false)}
                                                            ></button>
                                                        </div>
                                                        <div className="modal-body">
                                                            <input
                                                                type="text"
                                                                placeholder="Enter New Customer Name"
                                                                value={newCustomerName}
                                                                onChange={(e) => setNewCustomerName(e.target.value)}
                                                                style={{
                                                                    width: "100%",
                                                                    padding: "10px",
                                                                    marginBottom: "10px",
                                                                    border: "1px solid #ccc",
                                                                    borderRadius: "5px",
                                                                    fontSize: "1rem",
                                                                }}
                                                            />
                                                            <button
                                                                onClick={handleCreateCustomer}
                                                                className="btn w-100"
                                                                style={{
                                                                    padding: "10px 20px",
                                                                    fontSize: "1rem",
                                                                    fontWeight: "bold",
                                                                    backgroundColor: 'black',
                                                                    color: 'white'
                                                                }}
                                                            >
                                                                Create Customer
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>

                                <div className="text-center mt-4">
                                    {!isPhoneNumberSet ? (
                                        <div className="d-flex justify-content-center align-items-center">
                                            <input
                                                type="text"
                                                className="form-control w-75 me-2"
                                                placeholder="Enter phone number"
                                                value={phoneNumber}
                                                onChange={handlePhoneNumberChange}
                                                style={{ fontSize: "1rem", padding: "10px" }}
                                            />
                                            <button
                                                className="btn btn-primary"
                                                onClick={handleSetPhoneNumber}
                                                style={{
                                                    padding: "10px 20px",
                                                    backgroundColor: "black",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "5px",
                                                    fontWeight: "bold",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-muted">Ph: {phoneNumber}</p>
                                        </div>
                                    )}
                                </div>

                                {cartItems.length === 0 ? (
                                    <div className="text-center">
                                        <p className="text-muted mt-4">START ADDING PRODUCTS</p>
                                    </div>
                                ) : (
                                    <div>
                                        <h5 className="text-center mb-4 text-dark">Your Order</h5>
                                        <div className="table-responsive">
                                            <table className="table table-striped">
                                                <thead className="text-center ">
                                                    <tr>
                                                        <th>T.No.</th>
                                                        <th>Item Image</th>
                                                        <th>Item Name</th>
                                                        <th>Quantity</th>
                                                        <th>Price</th>
                                                        <th>Action</th>

                                                    </tr>
                                                </thead>
                                                <tbody className="text-center">
                                                    {cartItems.map((item, index) => {
                                                        const price = item.totalPrice || 0;
                                                        const quantity = item.quantity || 1;

                                                        return (
                                                            <tr key={index}>
                                                                <td>{tableNumber}</td>
                                                                <td>
                                                                    <img
                                                                        src={item.image}
                                                                        alt={item.name}
                                                                        className="rounded"
                                                                        style={{
                                                                            width: "70px",
                                                                            height: "50px",
                                                                            objectFit: "cover",
                                                                            border: "1px solid #ddd",
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td>{item.name}</td>
                                                                <td>
                                                                    <div className="d-flex justify-content-center align-items-center">
                                                                        <button
                                                                            className="btn btn-secondary btn-sm me-2"
                                                                            onClick={() => decreaseQuantity(item)}
                                                                            disabled={quantity <= 1}
                                                                        >
                                                                            -
                                                                        </button>
                                                                        {quantity}
                                                                        <button
                                                                            className="btn btn-secondary btn-sm ms-2"
                                                                            onClick={() => increaseQuantity(item)}
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td>${(price * quantity).toFixed(2)}</td>
                                                                <td>
                                                                    <button
                                                                        className="btn btn-danger btn-sm"
                                                                        onClick={() => removeFromCart(item)}
                                                                        title="Remove Item"
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="mt-4 text-center">
                                            <h6 className="text-dark">Total: ${cartTotal()}</h6>
                                            <button
                                                type="button"
                                                className="btn mt-2"
                                                onClick={saveOrder}
                                                style={{
                                                    padding: "10px 20px",
                                                    backgroundColor: "black",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "5px",
                                                    fontWeight: "bold",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Save
                                            </button>



                                            <span> </span>
                                            <button
                                                type="button"
                                                className="btn btn-success mt-2"
                                                onClick={() => {
                                                    handleCheckoutClick();
                                                }}
                                                style={{ padding: "10px 20px", fontSize: "1rem", fontWeight: "bold" }}
                                            >
                                                CheckOut Mode
                                            </button>
                                            <span> </span>
                                            {/* <button
                                                className="btn btn-info mt-2"
                                                onClick={() => navigate('/savedorders', { state: { savedOrders } })}
                                            >
                                                View Saved Orders
                                            </button> */}
                                        </div>

                                        {showButtons && (
                                            <div className="mt-3">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary mx-2"
                                                    onClick={() => {
                                                        handlePaymentSelection("CASH");
                                                        handleSaveToBackend();
                                                    }}
                                                >
                                                    CASH
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary mx-2"
                                                    onClick={() => {
                                                        handlePaymentSelection("CARD");
                                                        handleSaveToBackend();
                                                    }}
                                                >
                                                    CARD
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-warning mx-2"
                                                    onClick={() => {
                                                        handlePaymentSelection("UPI");
                                                        handleSaveToBackend();
                                                    }}
                                                >
                                                    UPI
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <SavedOrder orders={savedOrders} setSavedOrders={setSavedOrders} />
                {selectedItem && (
                    <FoodDetails
                        item={selectedItem}
                        combos={menuItems.filter((combo) => combo.type === 'combo')}
                        onClose={() => setSelectedItem(null)}
                        onUpdate={handleItemUpdate}
                    />
                )}
            </div>
        </>
    )
}

export default Front