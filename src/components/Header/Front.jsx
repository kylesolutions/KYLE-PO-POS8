import React, { useContext, useEffect, useRef, useState } from 'react';
import UserContext from '../../Context/UserContext';
import './front.css';
import { useLocation, useNavigate } from 'react-router-dom';
import FoodDetails from './FoodDetails';
import { v4 as uuidv4 } from 'uuid';
import SavedOrder from './SavedOrder';
import { useSelector } from 'react-redux';
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

function Front() {
    const [menuItems, setMenuItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("null");
    const [selectedItem, setSelectedItem] = useState(null);
    const [categories, setCategories] = useState([]);
    const [showButtons, setShowButtons] = useState(false);
    const { cartItems, addToCart, removeFromCart, updateCartItem, setCartItems } = useContext(UserContext);
    const location = useLocation();
    const { state } = useLocation();
    const { tableNumber, existingOrder } = state || {};
    useEffect(() => {
        if (location.state) {
            setPhoneNumber(location.state.phoneNumber || existingOrder?.phoneNumber || "");
            setCustomerName(location.state.customerName || existingOrder?.customerName || "One Time Customer");
            setIsPhoneNumberSet(!!(location.state.phoneNumber || existingOrder?.phoneNumber));
        }
    }, [location.state, existingOrder]);
    const [isPhoneNumberSet, setIsPhoneNumberSet] = useState(false);
    const [savedOrders, setSavedOrders] = useState([]);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [customers, setCustomers] = useState([]);
    const [customerName, setCustomerName] = useState("One Time Customer");
    const [newCustomerName, setNewCustomerName] = useState("");
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    const [bookedTables, setBookedTables] = useState([]);
    const user = useSelector((state) => state.user.user);
    const allowedItemGroups = useSelector((state) => state.user.allowedItemGroups);
    const allowedCustomerGroups = useSelector((state) => state.user.allowedCustomerGroups);
    const [taxTemplates, setTaxTemplates] = useState([]); // Store tax templates
    const [selectedTaxTemplate, setSelectedTaxTemplate] = useState("VAT - P"); // Default tax template
    const printRef = useRef();
    const [showBillModal, setShowBillModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

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
                        ingredients: item.ingredients || [],
                        kitchen: item.custom_kitchen,
                        type: item.type || "regular"
                    }));

                    setMenuItems(formattedItems);
                    const initialFilteredMenu = formattedItems.filter(
                        item => (allowedItemGroups.length === 0 || allowedItemGroups.includes(item.category)) &&
                            item.type !== "addon" && item.type !== "combo"
                    );
                    setFilteredItems(initialFilteredMenu);
                    const uniqueCategories = [...new Set(formattedItems.map((item) => item.category.toLowerCase()))];
                    setCategories(uniqueCategories);
                } else {
                    throw new Error('Invalid data structure or missing message array');
                }
            } catch (error) {
                console.error('Error fetching items:', error);
            }
        };

        fetchItems();
    }, [allowedItemGroups]);

    // Fetch tax templates
    useEffect(() => {
        const fetchTaxes = async () => {
            try {
                const response = await fetch(
                    "http://109.199.100.136:6060/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_sales_taxes_details"
                );
                const data = await response.json();
                if (data.message && Array.isArray(data.message)) {
                    setTaxTemplates(data.message);
                    // Set default tax template to "VAT - P" if it exists
                    const defaultTax = data.message.find(tax => tax.name === "VAT - P");
                    if (defaultTax) setSelectedTaxTemplate(defaultTax.name);
                }
            } catch (error) {
                console.error("Error fetching taxes:", error);
            }
        };
        fetchTaxes();
    }, []);

    const handleFilter = (category) => {
        const filtered = menuItems.filter(item =>
            (category === "All" || item.category.toLowerCase() === category.toLowerCase()) &&
            item.type !== "addon" &&
            item.type !== "combo"
        );
        setFilteredItems(filtered);
        setSelectedCategory(category);
    };

    const handlePhoneNumberChange = (e) => setPhoneNumber(e.target.value);

    const handleSetPhoneNumber = () => {
        if (phoneNumber.trim() === "") {
            alert("Please enter a valid phone number.");
            return;
        }
        setIsPhoneNumberSet(true);
    };

    const handleItemClick = (item) => setSelectedItem(item);

    const handleItemUpdate = (updatedItem) => {
        updateCartItem(updatedItem);
        setSelectedItem(null);
    };

    const cartTotal = () => {
        const total = cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        return isNaN(total) ? 0 : total;
    };

    // Calculate tax amount and grand total locally for display
    const getTaxRate = () => {
        const tax = taxTemplates.find(t => t.name === selectedTaxTemplate);
        return tax && tax.sales_tax.length > 0 ? parseFloat(tax.sales_tax[0].rate) : 5; // Default to 5% if no tax found
    };

    const getTaxAmount = () => {
        const subTotal = cartTotal();
        const taxRate = getTaxRate();
        return (subTotal * taxRate) / 100;
    };

    const getGrandTotal = () => {
        return cartTotal() + getTaxAmount();
    };

    const handleCheckoutClick = () => setShowButtons(true);

    const increaseQuantity = (item) => {
        setCartItems(prevItems =>
            prevItems.map(cartItem =>
                cartItem.id === item.id &&
                JSON.stringify(cartItem.addonCounts) === JSON.stringify(item.addonCounts) &&
                JSON.stringify(cartItem.selectedCombos) === JSON.stringify(item.selectedCombos)
                    ? {
                        ...cartItem,
                        quantity: cartItem.quantity + 1,
                        totalPrice: (cartItem.basePrice + getAddonsTotal(cartItem) + getCombosTotal(cartItem)) * (cartItem.quantity + 1)
                    }
                    : cartItem
            )
        );
    };

    const decreaseQuantity = (item) => {
        setCartItems(prevItems =>
            prevItems.map(cartItem =>
                cartItem.id === item.id &&
                JSON.stringify(cartItem.addonCounts) === JSON.stringify(item.addonCounts) &&
                JSON.stringify(cartItem.selectedCombos) === JSON.stringify(item.selectedCombos) &&
                cartItem.quantity > 1
                    ? {
                        ...cartItem,
                        quantity: cartItem.quantity - 1,
                        totalPrice: (cartItem.basePrice + getAddonsTotal(cartItem) + getCombosTotal(cartItem)) * (cartItem.quantity - 1)
                    }
                    : cartItem
            )
        );
    };

    const getAddonsTotal = (item) => {
        return Object.values(item.addonCounts || {}).reduce((sum, price) => sum + price, 0);
    };

    const getCombosTotal = (item) => {
        return (item.selectedCombos || []).reduce((sum, combo) => sum + (combo.price || 0), 0);
    };

    const handleNavigation = () => {
        if (tableNumber) {
            navigate('/kitchen', { state: { tableNumber, customerName } });
        } else {
            alert("No table selected.");
        }
    };

    const handlePaymentSelection = async (method) => {
        const subTotal = cartTotal();
        const paymentDetails = {
            mode_of_payment: method,
            amount: subTotal.toFixed(2), // Send subtotal; backend will adjust with taxes
        };

        console.log("Payment Details (Before Sending to Backend):", paymentDetails);

        if (!paymentDetails || !paymentDetails.mode_of_payment) {
            console.error("Error: Payment Details are missing or incorrect!", paymentDetails);
            alert("Error: Payment method is not defined. Please try again.");
            return;
        }

        const billDetails = {
            customerName,
            phoneNumber: phoneNumber || "N/A",
            items: cartItems.map((item) => ({
                name: item.name,
                price: item.basePrice,
                quantity: item.quantity,
                totalPrice: item.basePrice * item.quantity,
                addonCounts: item.addonCounts || {},
                selectedCombos: item.selectedCombos || [],
            })),
            subTotal: subTotal.toFixed(2),
            vatRate: getTaxRate(),
            vatAmount: getTaxAmount().toFixed(2),
            totalAmount: getGrandTotal().toFixed(2),
            payments: [paymentDetails],
        };

        try {
            await handleSaveToBackend(paymentDetails, subTotal);

            if (method === "CASH") {
                navigate("/cash", { state: { billDetails } });
            } else if (method === "CARD") {
                navigate("/card", { state: { billDetails } });
            } else if (method === "UPI") {
                alert("Redirecting to UPI payment... Please complete the payment in your UPI app.");
            }

            handlePaymentCompletion(tableNumber);
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

    const handleSaveToBackend = async (paymentDetails, subTotal) => {
        console.log("Inside handleSaveToBackend | Payment Details:", paymentDetails);
        console.log("Cart Items:", cartItems);

        if (!paymentDetails || typeof paymentDetails !== "object") {
            console.error("handleSaveToBackend received invalid paymentDetails:", paymentDetails);
            alert("Error: Invalid payment details. Please try again.");
            return;
        }

        if (!paymentDetails.mode_of_payment) {
            console.error("Error: mode_of_payment is missing in paymentDetails!", paymentDetails);
            alert("Error: Payment method is missing. Please try again.");
            return;
        }

        const allItems = cartItems.map((item) => ({
            item_name: item.name,
            item_code: item.item_code || "",
            description: item.description && item.description.trim() !== "" ? item.description : `Order for ${item.name}`,
            qty: item.quantity,
            rate: item.basePrice,
            amount: item.basePrice * item.quantity,
            addonCounts: item.addonCounts || {},
            selectedCombos: item.selectedCombos || [],
        }));

        if (allItems.length === 0) {
            console.error("Error: No items in the cart.");
            alert("Error: Cannot create an order with no items.");
            return;
        }

        const payload = {
            customer: customerName,
            posting_date: new Date().toISOString().split("T")[0],
            due_date: new Date().toISOString().split("T")[0],
            is_pos: 1,
            currency: "INR",
            conversion_rate: 1,
            selling_price_list: "Standard Selling",
            price_list_currency: "INR",
            plc_conversion_rate: 1,
            total: subTotal.toFixed(2), // Subtotal before taxes
            net_total: subTotal.toFixed(2),
            base_net_total: subTotal.toFixed(2),
            taxes_and_charges: selectedTaxTemplate, // Send selected tax template
            payments: [{
                mode_of_payment: paymentDetails.mode_of_payment,
                amount: paymentDetails.amount, // Subtotal; backend will adjust
            }],
            items: allItems,
        };

        console.log("Final Payload before sending to backend:", payload);

        try {
            const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.create_pos_invoice", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok && result.status === "success") {
                alert(`POS Invoice saved successfully! Grand Total: ₹${result.grand_total}`);
                setCartItems([]);
                localStorage.removeItem("savedOrders");
            } else {
                console.error("Backend response error:", result);
            }
        } catch (error) {
            console.error("Network or Request Error:", error);
            alert("A network error occurred. Please check your connection and try again.");
        }
    };

    const handleShow = () => setShowPaymentModal(true);
    const handleClose = () => setShowPaymentModal(false);

    const handlePayment = (method) => {
        handlePaymentSelection(method);
        handleClose();
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
            setCartItems([]);
            return updatedOrders;
        });
        alert(`Order for Table ${tableNumber} saved successfully!`);
    };

    const cancelCart = () => setCartItems([]);

    return (
        <>
            <div className="container-fluid">
                <div className="row">
                    <div className="col-lg-1">
                        <div className="row p-2">
                            {categories.map((category, index) => (
                                <div key={index} className="col-lg-12 mb-2">
                                    <button
                                        className={`text-dark w-100 rounded d-flex align-items-center justify-content-center ${selectedCategory === category ? 'active-category' : ''}`}
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
                                        <img className="card-img-top" src={item.image} alt={item.name} width={100} height={100} />
                                        <div className="card-body p-2 mb-0 category-name">
                                            <h4 className="card-title fs-6 text-center mb-0">{item.name}</h4>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <SavedOrder orders={savedOrders} setSavedOrders={setSavedOrders} />
                        </div>
                    </div>

                    <div className="col-lg-4 row1 px-4">
                        <div className="row p-2 mt-2 border shadow rounded" style={{ "height": "80vh" }}>
                            <div className="col-12 p-2 p-md-2 mb-3 d-flex justify-content-between flex-column">
                                <div className="text-center row">
                                    <div className='row'>
                                        <div className='col-lg-1 text-start'>
                                            <h1
                                                className="display-4 fs-2"
                                                style={{
                                                    background: tableNumber ? "black" : "transparent",
                                                    color: tableNumber ? "white" : "inherit",
                                                    borderRadius: tableNumber ? "5px" : "0",
                                                    padding: tableNumber ? "4px 20px" : "0",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center"
                                                }}
                                            >
                                                {tableNumber}
                                            </h1>
                                        </div>
                                        <div className='col-10 col-lg-5 mb-2'>
                                            <select
                                                id="customer-select"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                style={{
                                                    width: "100%",
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
                                        </div>
                                        <div className='col-2 col-lg-1 mb-2' style={{ background: "black", color: "white", borderRadius: "5px", padding: "5px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <span
                                                onClick={() => setShowModal(true)}
                                                style={{ fontSize: "1.5rem", fontWeight: "bold", cursor: "pointer" }}
                                            >
                                                <i className="bi bi-plus"></i>
                                            </span>
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

                                        {!isPhoneNumberSet ? (
                                            <>
                                                <div className='col-10 col-lg-4 mb-2'>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Enter phone number"
                                                        value={phoneNumber}
                                                        onChange={handlePhoneNumberChange}
                                                        style={{ fontSize: "1rem", padding: "10px", width: "100%" }}
                                                    />
                                                </div>
                                                <div className='col-2 col-lg-1 mb-2' style={{ background: "black", color: "white", borderRadius: "5px", padding: "5px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <span
                                                        onClick={handleSetPhoneNumber}
                                                        style={{ fontWeight: "bold", cursor: "pointer" }}
                                                    >
                                                        <i className="bi bi-send"></i>
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className='col-10 col-lg-5 mb-2 d-flex align-items-center'>
                                                <p className="text-muted mb-0">Ph: {phoneNumber}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tax Selection Dropdown */}
                                    <div className="row mt-2">
                                        <div className="col-12">
                                            <label htmlFor="tax-template" className="form-label" style={{ fontSize: "14px" }}>Select Tax Template:</label>
                                            <select
                                                id="tax-template"
                                                value={selectedTaxTemplate}
                                                onChange={(e) => setSelectedTaxTemplate(e.target.value)}
                                                className="form-control"
                                                style={{ padding: "8px", fontSize: "14px" }}
                                            >
                                                {taxTemplates.length > 0 ? (
                                                    taxTemplates.map((tax, index) => (
                                                        <option key={index} value={tax.name}>
                                                            {tax.name} ({tax.sales_tax[0]?.rate || 0}%)
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option value="VAT - P">VAT - P (5%)</option>
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="table-responsive mt-3">
                                        <table className="table border text-start">
                                            <thead className="text-start">
                                                <tr>
                                                    <th>T.No.</th>
                                                    <th>Item Name</th>
                                                    <th>Qty</th>
                                                    <th>Price</th>
                                                    <th>Total Price</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-start">
                                                {cartItems.map((item, index) => {
                                                    const price = item.totalPrice || 0;
                                                    const quantity = item.quantity || 1;

                                                    return (
                                                        <tr key={index}>
                                                            <td className='text-start'>{tableNumber}</td>
                                                            <td className='text-start'>
                                                                {item.name}
                                                                {item.addonCounts && Object.keys(item.addonCounts).length > 0 && (
                                                                    <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#888" }}>
                                                                        {Object.entries(item.addonCounts).map(([addonName, addonPrice]) => (
                                                                            <li key={addonName}>+ {addonName} (${addonPrice})</li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                                {item.selectedCombos && item.selectedCombos.length > 0 && (
                                                                    <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#555" }}>
                                                                        {item.selectedCombos.map((combo, idx) => (
                                                                            <li key={idx}>+ {combo.name1} - ${combo.combo_price}</li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                            </td>
                                                            <td>
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
                                                            </td>
                                                            <td className='text-start'>${item.basePrice}</td>
                                                            <td className='text-start'>${item.totalPrice.toFixed(2)}</td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm"
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
                                </div>
                            </div>
                        </div>

                        <div className="row p-2 mt-2 border shadow rounded">
                            <div className="col-12">
                                <div className="row">
                                    <div className="col-12 col-lg-6">
                                        <div className="row">
                                            <div className="col-md-6 mb-2 col-6">
                                                <h5 className="mb-0" style={{ "font-size": "12px" }}>Total Quantity</h5>
                                                <div className='grand-tot-div justify-content-end'>
                                                    <span>{cartItems.reduce((total, item) => total + (item.quantity || 1), 0)}</span>
                                                </div>
                                            </div>
                                            <div className="col-md-6 mb-2 col-6">
                                                <h5 className="mb-0" style={{ "font-size": "12px" }}>Subtotal</h5>
                                                <div className='grand-tot-div'>
                                                    <span>$</span><span>{cartTotal().toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <div className="col-md-6 mb-2 col-6">
                                                <h5 className="mb-0" style={{ fontSize: "12px" }}>Tax</h5>
                                                <div className='grand-tot-div justify-content-end'>
                                                    <span>${getTaxAmount().toFixed(2)} ({getTaxRate()}%)</span>
                                                </div>
                                            </div>
                                            <div className="col-md-6 mb-2 col-6">
                                                <h5 className="mb-0" style={{ "font-size": "12px" }}>Grand Total</h5>
                                                <div className='grand-tot-div justify-content-end'>
                                                    <span>${getGrandTotal().toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12 col-lg-6">
                                        <div className="row">
                                            <div className="col-md-6 mb-2 col-6">
                                                <button
                                                    type="button"
                                                    className="btn mt-3 w-100"
                                                    onClick={saveOrder}
                                                    style={{
                                                        padding: "10px 12px",
                                                        backgroundColor: "black",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "5px",
                                                        fontWeight: "bold",
                                                        cursor: "pointer",
                                                        fontSize: "12px"
                                                    }}
                                                >
                                                    Save/New
                                                </button>
                                            </div>
                                            <div className="col-md-6 mb-2 col-6">
                                                <button
                                                    type="button"
                                                    className="btn mt-3 w-100"
                                                    onClick={() => setShowBillModal(true)}
                                                    style={{
                                                        padding: "10px 12px",
                                                        background: "blue",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "5px",
                                                        fontWeight: "bold",
                                                        cursor: "pointer",
                                                        fontSize: "12px"
                                                    }}
                                                >
                                                    Print
                                                </button>
                                            </div>

                                            {showBillModal && (
                                                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                                                    <div className="modal-dialog modal-lg">
                                                        <div className="modal-content">
                                                            <div className="modal-header">
                                                                <h4 className="modal-title">Invoice / Bill</h4>
                                                                <button className="btn-close" onClick={() => setShowBillModal(false)}></button>
                                                            </div>
                                                            <div className="modal-body">
                                                                <div className="bill-section border p-3 shadow rounded">
                                                                    <div className="d-flex justify-content-between">
                                                                        <p><strong>Table No:</strong> {tableNumber}</p>
                                                                        <p><strong>Customer:</strong> {customerName}</p>
                                                                    </div>
                                                                    <table className="table border text-start mt-2">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Item</th>
                                                                                <th>Qty</th>
                                                                                <th>Rate</th>
                                                                                <th>Total</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {cartItems.map((item, index) => (
                                                                                <tr key={index}>
                                                                                    <td>
                                                                                        {item.name}
                                                                                        {item.addonCounts && Object.keys(item.addonCounts).length > 0 && (
                                                                                            <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#888" }}>
                                                                                                {Object.entries(item.addonCounts).map(([addonName, addonPrice]) => (
                                                                                                    <li key={addonName}>+ {addonName} (${addonPrice})</li>
                                                                                                ))}
                                                                                            </ul>
                                                                                        )}
                                                                                        {item.selectedCombos && item.selectedCombos.length > 0 && (
                                                                                            <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#555" }}>
                                                                                                {item.selectedCombos.map((combo, idx) => (
                                                                                                    <li key={idx}>+ {combo.name1} ({combo.size}) - ${combo.price}</li>
                                                                                                ))}
                                                                                            </ul>
                                                                                        )}
                                                                                    </td>
                                                                                    <td>{item.quantity || 1}</td>
                                                                                    <td>${item.basePrice}</td>
                                                                                    <td>${item.totalPrice.toFixed(2)}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                    <div className="row mt-3">
                                                                        <div className="col-6 text-start"><strong>Total Quantity:</strong></div>
                                                                        <div className="col-6 text-end">{cartItems.reduce((total, item) => total + (item.quantity || 1), 0)}</div>
                                                                        <div className="col-6 text-start"><strong>Subtotal:</strong></div>
                                                                        <div className="col-6 text-end">${cartTotal().toFixed(2)}</div>
                                                                        <div className="col-6 text-start"><strong>VAT ({getTaxRate()}%):</strong></div>
                                                                        <div className="col-6 text-end">${getTaxAmount().toFixed(2)}</div>
                                                                        <div className="col-6 text-start"><strong>Grand Total:</strong></div>
                                                                        <div className="col-6 text-end"><strong>${getGrandTotal().toFixed(2)}</strong></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="modal-footer">
                                                                <button className="btn btn-secondary" onClick={() => setShowBillModal(false)}>Close</button>
                                                                <button className="btn btn-dark" onClick={() => window.print()}>
                                                                    <i className="bi bi-printer"></i> Print Bill
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="col-md-6 mb-2 col-6">
                                                <button
                                                    type="button"
                                                    className="btn mt-3 w-100"
                                                    onClick={cancelCart}
                                                    style={{
                                                        padding: "10px 12px",
                                                        backgroundColor: "red",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "5px",
                                                        fontWeight: "bold",
                                                        cursor: "pointer",
                                                        fontSize: "12px"
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                            <div className="col-md-6 mb-2 col-6">
                                                <button
                                                    type="button"
                                                    className="btn btn-success mt-3 w-100"
                                                    onClick={() => {
                                                        handleCheckoutClick();
                                                        handleShow();
                                                    }}
                                                    style={{ padding: "10px 12px", fontSize: "12px", fontWeight: "bold" }}
                                                >
                                                    Pay
                                                </button>
                                            </div>
                                        </div>

                                        <Modal show={showPaymentModal} onHide={handleClose} centered>
                                            <Modal.Header closeButton>
                                                <Modal.Title>Select Payment Method</Modal.Title>
                                            </Modal.Header>
                                            <Modal.Body>
                                                <div className="row">
                                                    <div className="col-4">
                                                        <Button variant="primary" className="w-100" onClick={() => handlePayment("CASH")}>
                                                            CASH
                                                        </Button>
                                                    </div>
                                                    <div className="col-4">
                                                        <Button variant="secondary" className="w-100" onClick={() => handlePayment("CARD")}>
                                                            CARD
                                                        </Button>
                                                    </div>
                                                    <div className="col-4">
                                                        <Button variant="warning" className="w-100" onClick={() => handlePayment("UPI")}>
                                                            UPI
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Modal.Body>
                                            <Modal.Footer>
                                                <Button variant="danger" onClick={handleClose}>
                                                    Cancel
                                                </Button>
                                            </Modal.Footer>
                                        </Modal>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

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
    );
}

export default Front;