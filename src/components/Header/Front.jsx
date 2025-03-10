import React, { useContext, useEffect, useState } from 'react';
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
    const { cartItems, addToCart, removeFromCart, updateCartItem, setCartItems, totalPrice } = useContext(UserContext);
    const location = useLocation();
    const { state } = useLocation();
    const { tableNumber, existingOrder, deliveryType } = state || {};

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
    const [taxTemplates, setTaxTemplates] = useState([]);
    const [selectedTaxTemplate, setSelectedTaxTemplate] = useState("VAT - P");

    const [address, setAddress] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [email, setEmail] = useState("");

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
                        addons: (item.addons || []).map((addon) => ({
                            name: addon.name || addon.item_name || "Unnamed Addon",
                            price: addon.price || addon.price_list_rate || 0,
                            kitchen: addon.kitchen || addon.custom_kitchen || "Unknown",
                        })),
                        combos: (item.combos || []).map((combo) => ({
                            name1: combo.name1 || combo.item_name || "Unnamed Combo",
                            combo_price: combo.price || combo.combo_price || combo.price_list_rate || 0,
                            kitchen: combo.kitchen || combo.custom_kitchen || "Unknown",
                            variants: combo.variants || [],
                        })),
                        variants: item.variants || [],
                        ingredients: item.ingredients || [],
                        kitchen: item.custom_kitchen || "Unknown",
                        type: item.type || "regular",
                    }));

                    setMenuItems(formattedItems);
                    const initialFilteredMenu = formattedItems.filter(
                        (item) =>
                            (allowedItemGroups.length === 0 || allowedItemGroups.includes(item.category)) &&
                            item.type !== "addon" &&
                            item.type !== "combo"
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

    useEffect(() => {
        const fetchTaxes = async () => {
            try {
                const response = await fetch(
                    "http://109.199.100.136:6060/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_sales_taxes_details"
                );
                const data = await response.json();
                if (data.message && Array.isArray(data.message)) {
                    setTaxTemplates(data.message);
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
        console.log("Updated Item from FoodDetails:", updatedItem);
        updateCartItem(updatedItem);
        setSelectedItem(null);
    };

    const getTaxRate = () => {
        const tax = taxTemplates.find(t => t.name === selectedTaxTemplate);
        return tax && tax.sales_tax.length > 0 ? parseFloat(tax.sales_tax[0].rate) : 5;
    };

    const getSubTotal = () => {
        return cartItems.reduce((sum, item) => {
            const mainPrice = item.basePrice * item.quantity;
            const addonPrice = Object.entries(item.addonCounts || {}).reduce(
                (sum, [_, { price, quantity }]) => sum + (price * quantity), 0
            );
            const comboPrice = (item.selectedCombos || []).reduce(
                (sum, combo) => sum + ((combo.combo_price || 0) + (combo.variantPrice || 0)) * (combo.quantity || 1), 0
            );
            return sum + mainPrice + addonPrice + comboPrice;
        }, 0);
    };

    const getTaxAmount = () => {
        const subTotal = getSubTotal();
        const taxRate = getTaxRate();
        return (subTotal * taxRate) / 100;
    };

    const getGrandTotal = () => {
        return getSubTotal() + getTaxAmount();
    };

    const handleCheckoutClick = () => setShowButtons(true);

    const increaseQuantity = (item) => {
        updateCartItem({ ...item, quantity: item.quantity + 1 });
    };

    const decreaseQuantity = (item) => {
        if (item.quantity > 1) {
            updateCartItem({ ...item, quantity: item.quantity - 1 });
        }
    };

    const handleNavigation = () => {
        if (tableNumber) {
            navigate('/kitchen', { state: { tableNumber, customerName } });
        } else {
            alert("No table selected.");
        }
    };

    const handlePaymentSelection = async (method) => {
        const subTotal = getSubTotal();
        const grandTotal = getGrandTotal();
        const paymentDetails = {
            mode_of_payment: method,
            amount: grandTotal.toFixed(2),
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
                totalPrice: (item.basePrice * item.quantity) +
                    Object.entries(item.addonCounts || {}).reduce((sum, [_, { price, quantity }]) => sum + (price * quantity), 0) +
                    (item.selectedCombos || []).reduce((sum, combo) => sum + ((combo.combo_price || 0) + (combo.variantPrice || 0)) * (combo.quantity || 1), 0),
                addonCounts: item.addonCounts || {},
                selectedCombos: item.selectedCombos || [],
            })),
            subTotal: subTotal.toFixed(2),
            vatRate: getTaxRate(),
            vatAmount: getTaxAmount().toFixed(2),
            totalAmount: grandTotal.toFixed(2),
            payments: [paymentDetails],
            ...(deliveryType !== "DINE IN" && {
                address,
                whatsappNumber,
                email,
            }),
        };

        try {
            await handleSaveToBackend(paymentDetails, subTotal);

            if (method === "CASH") {
                navigate("/cash", { state: { billDetails } });
            } else if (method === "CREDIT CARD") {
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
        alert(`Payment for Table ${tableNumber || "Order"} is completed.`);
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

        const allItems = cartItems.flatMap((item) => {
            const mainItem = {
                item_name: item.name,
                item_code: item.item_code || "",
                description: item.description && item.description.trim() !== "" ? item.description : `Order for ${item.name}`,
                qty: item.quantity,
                rate: item.basePrice,
                amount: item.basePrice * item.quantity,
                kitchen: item.kitchen || "Unknown",
            };

            const addonItems = Object.entries(item.addonCounts || {}).map(([addonName, { price, quantity, kitchen }]) => ({
                item_name: addonName,
                description: `Addon: ${addonName}`,
                qty: quantity,
                rate: price,
                amount: price * quantity,
                kitchen: kitchen || "Unknown",
            }));

            const comboItems = (item.selectedCombos || []).map((combo) => ({
                item_name: combo.name1,
                description: `Combo: ${combo.name1}${combo.selectedVariant ? ` (${combo.selectedVariant})` : ''}`,
                qty: combo.quantity || 1,
                rate: (combo.combo_price || 0) + (combo.variantPrice || 0),
                amount: ((combo.combo_price || 0) + (combo.variantPrice || 0)) * (combo.quantity || 1),
                kitchen: combo.kitchen || "Unknown",
            }));

            return [mainItem, ...addonItems, ...comboItems];
        });

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
            total: subTotal.toFixed(2),
            net_total: subTotal.toFixed(2),
            base_net_total: subTotal.toFixed(2),
            taxes_and_charges: selectedTaxTemplate,
            payments: [{
                mode_of_payment: paymentDetails.mode_of_payment,
                amount: paymentDetails.amount,
            }],
            items: allItems,
            ...(deliveryType !== "DINE IN" && {
                custom_address: address,
                custom_whatsapp_number: whatsappNumber,
                custom_email: email,
            }),
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
            console.log("Raw Backend Response:", result);

            if (response.ok && result.message?.status === "success") {
                alert(`POS Invoice saved successfully! Grand Total: ₹${result.message.grand_total}`);
                setCartItems([]);
                localStorage.removeItem("savedOrders");
            } else {
                console.error("Backend response error:", result);
                alert(`Failed to save POS Invoice: ${result.message?.message || "Unknown error"}`);
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

    const [customerInput, setCustomerInput] = useState("");
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

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
                console.log("Raw Customer API Response:", data);
                let customerList = [];
                if (Array.isArray(data)) {
                    customerList = data;
                } else if (data.message && Array.isArray(data.message)) {
                    customerList = data.message;
                }
                const formattedCustomers = customerList.map(customer => ({
                    customer_name: customer.customer_name || "",
                    mobile_no: customer.mobile_no || "",
                    primary_address: customer.primary_address || "",
                    email_id: customer.email_id || "",
                    custom_watsapp_no: customer.custom_watsapp_no || ""
                }));
                setCustomers(formattedCustomers);
                setFilteredCustomers(formattedCustomers);
            } catch (error) {
                console.error("Network error fetching customers:", error);
            }
        };
        fetchCustomers();
    }, []);

    const handleCustomerInputChange = (e) => {
        const value = e.target.value;
        setCustomerInput(value);
        setCustomerName(value);
        setShowCustomerSuggestions(true);

        if (value.trim() === "") {
            setFilteredCustomers(customers);
        } else {
            const filtered = customers.filter((customer) =>
                customer.customer_name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredCustomers(filtered);
        }
    };

    const handleCustomerSelect = (selectedCustomerName) => {
        const selectedCustomer = customers.find(
            (customer) => customer.customer_name.toLowerCase() === selectedCustomerName.toLowerCase()
        );
        if (selectedCustomer) {
            setCustomerInput(selectedCustomer.customer_name);
            setCustomerName(selectedCustomer.customer_name);
            setPhoneNumber(selectedCustomer.mobile_no);
            setAddress(selectedCustomer.primary_address);
            setEmail(selectedCustomer.email_id);
            setWhatsappNumber(selectedCustomer.custom_watsapp_no);
            setIsPhoneNumberSet(!!selectedCustomer.mobile_no);
        }
        setShowCustomerSuggestions(false);
    };

    const handleCustomerSubmit = async () => {
        const trimmedInput = customerInput.trim();
        if (!trimmedInput) {
            alert("Customer name is required.");
            return;
        }

        const customerExists = customers.some(
            (customer) => customer.customer_name.toLowerCase() === trimmedInput.toLowerCase()
        );

        if (!customerExists) {
            try {
                const customerData = {
                    customer_name: trimmedInput,
                    ...(phoneNumber && { phone: phoneNumber }),
                    ...(address && { address: address }),
                    ...(email && { email: email }),
                    ...(whatsappNumber && { whatsapp_number: whatsappNumber }),
                };

                const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.create_customer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
                    },
                    body: JSON.stringify(customerData),
                });

                const data = await response.json();
                if (data.status === "success") {
                    alert("Customer created successfully!");
                    const newCustomer = {
                        customer_name: trimmedInput,
                        mobile_no: phoneNumber || "",
                        primary_address: address || "",
                        email_id: email || "",
                        custom_watsapp_no: whatsappNumber || ""
                    };
                    setCustomers((prev) => [...prev, newCustomer]);
                    setFilteredCustomers((prev) => [...prev, newCustomer]);
                    setCustomerName(trimmedInput);
                } else {
                    alert(data.message || "Failed to create customer.");
                }
            } catch (error) {
                console.error("Error creating customer:", error);
                alert("Failed to create customer. Please try again.");
            }
        } else {
            handleCustomerSelect(trimmedInput);
        }
        setShowCustomerSuggestions(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleCustomerSubmit();
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
            ...(deliveryType !== "DINE IN" && { address, whatsappNumber, email }),
        };

        console.log("Saving Order:", newOrder);

        setSavedOrders((prev) => {
            const existingOrders = prev.filter((order) => order.tableNumber !== tableNumber);
            const updatedOrders = [...existingOrders, newOrder];
            localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
            setCartItems([]);
            return updatedOrders;
        });
        alert(`Order for ${tableNumber ? `Table ${tableNumber}` : deliveryType} saved successfully!`);
    };

    const cancelCart = () => setCartItems([]);

    return (
        <>
            <div className="container-fluid">
                <div className="row">
                    <div className="col-lg-1 category-sidebar">
                        <div className="row p-2">
                            {categories.map((category, index) => (
                                <div key={index} className="col-lg-12 mb-2">
                                    <button
                                        className={`category-btn w-100 rounded d-flex align-items-center justify-content-start ${selectedCategory === category ? 'active' : ''
                                            }`}
                                        onClick={() => handleFilter(category)}
                                    >
                                        {/* Optional: Add an icon (e.g., using Bootstrap Icons) */}
                                        <i className="bi bi-list me-2"></i>
                                        <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="col-lg-7 row2">
                        <div className="row" style={{ height: '90vh', overflowY: 'auto' }}>
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
                        </div>
                        <SavedOrder orders={savedOrders} setSavedOrders={setSavedOrders} />
                    </div>

                    <div className="col-lg-4 row1 px-4">
                        <div className="d-flex flex-column" style={{ height: '90vh' }}>
                            {/* Scrollable Section */}
                            <div className="row p-2 mt-2 border shadow rounded flex-grow-1" style={{ overflowY: 'auto' }}>
                                <div className="col-12 p-2 p-md-2 mb-3">
                                    <div className="text-center row">
                                        <div className='row'>
                                            {tableNumber ? (
                                                <>
                                                    <div className='col-lg-1 text-start' style={{ position: "relative" }}>
                                                        <h1
                                                            className="display-4 fs-2"
                                                            style={{
                                                                background: tableNumber ? "black" : "transparent",
                                                                color: tableNumber ? "white" : "inherit",
                                                                borderRadius: tableNumber ? "5px" : "0",
                                                                padding: tableNumber ? "4px 20px" : "0",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            }}
                                                        >
                                                            <small
                                                                style={{
                                                                    position: "absolute",
                                                                    top: "0px",
                                                                    left: "50%",
                                                                    transform: "translateX(-50%)",
                                                                    fontSize: "10px",
                                                                    color: "#fff",
                                                                }}
                                                            >
                                                                T.no
                                                            </small>
                                                            {tableNumber}
                                                        </h1>
                                                    </div>
                                                    <div className='col-10 col-lg-5 mb-2 position-relative'>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Enter Customer Name"
                                                            value={customerInput}
                                                            onChange={handleCustomerInputChange}
                                                            onKeyPress={handleKeyPress}
                                                            style={{
                                                                width: "100%",
                                                                padding: "10px",
                                                                border: "1px solid #ccc",
                                                                borderRadius: "5px",
                                                                fontSize: "1rem",
                                                            }}
                                                        />
                                                        {showCustomerSuggestions && filteredCustomers.length > 0 && (
                                                            <ul
                                                                className="customer-suggestions"
                                                                style={{
                                                                    position: "absolute",
                                                                    top: "100%",
                                                                    left: 0,
                                                                    width: "100%",
                                                                    maxHeight: "150px",
                                                                    overflowY: "auto",
                                                                    backgroundColor: "#fff",
                                                                    border: "1px solid #ccc",
                                                                    borderRadius: "5px",
                                                                    listStyleType: "none",
                                                                    padding: 0,
                                                                    margin: 0,
                                                                    zIndex: 1000,
                                                                }}
                                                            >
                                                                {filteredCustomers.map((customer, index) => (
                                                                    <li
                                                                        key={index}
                                                                        onClick={() => handleCustomerSelect(customer.customer_name)}
                                                                        style={{
                                                                            padding: "8px 12px",
                                                                            cursor: "pointer",
                                                                            borderBottom: "1px solid #eee",
                                                                        }}
                                                                        onMouseEnter={(e) => (e.target.style.backgroundColor = "#f0f0f0")}
                                                                        onMouseLeave={(e) => (e.target.style.backgroundColor = "#fff")}
                                                                    >
                                                                        {customer.customer_name}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                    <div className='col-2 col-lg-1 mb-2' style={{ background: "black", color: "white", borderRadius: "5px", padding: "5px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <span
                                                            onClick={handleCustomerSubmit}
                                                            style={{ fontSize: "1.5rem", fontWeight: "bold", cursor: "pointer" }}
                                                        >
                                                            <i className="bi bi-check"></i>
                                                        </span>
                                                    </div>

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
                                                </>
                                            ) : (
                                                <>
                                                    <div className='col-10 col-lg-5 mb-2 position-relative'>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Enter Customer Name"
                                                            value={customerInput}
                                                            onChange={handleCustomerInputChange}
                                                            onKeyPress={handleKeyPress}
                                                            style={{
                                                                width: "100%",
                                                                padding: "10px",
                                                                border: "1px solid #ccc",
                                                                borderRadius: "5px",
                                                                fontSize: "1rem",
                                                            }}
                                                        />
                                                        {showCustomerSuggestions && filteredCustomers.length > 0 && (
                                                            <ul
                                                                className="customer-suggestions"
                                                                style={{
                                                                    position: "absolute",
                                                                    top: "100%",
                                                                    left: 0,
                                                                    width: "100%",
                                                                    maxHeight: "150px",
                                                                    overflowY: "auto",
                                                                    backgroundColor: "#fff",
                                                                    border: "1px solid #ccc",
                                                                    borderRadius: "5px",
                                                                    listStyleType: "none",
                                                                    padding: 0,
                                                                    margin: 0,
                                                                    zIndex: 1000,
                                                                }}
                                                            >
                                                                {filteredCustomers.map((customer, index) => (
                                                                    <li
                                                                        key={index}
                                                                        onClick={() => handleCustomerSelect(customer.customer_name)}
                                                                        style={{
                                                                            padding: "8px 12px",
                                                                            cursor: "pointer",
                                                                            borderBottom: "1px solid #eee",
                                                                        }}
                                                                        onMouseEnter={(e) => (e.target.style.backgroundColor = "#f0f0f0")}
                                                                        onMouseLeave={(e) => (e.target.style.backgroundColor = "#fff")}
                                                                    >
                                                                        {customer.customer_name}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                    <div className='col-2 col-lg-1 mb-2' style={{ background: "black", color: "white", borderRadius: "5px", padding: "5px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <span
                                                            onClick={handleCustomerSubmit}
                                                            style={{ fontSize: "1.5rem", fontWeight: "bold", cursor: "pointer" }}
                                                        >
                                                            <i className="bi bi-check"></i>
                                                        </span>
                                                    </div>

                                                    {!isPhoneNumberSet ? (
                                                        <>
                                                            <div className='col-10 col-lg-5 mb-2'>
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
                                                </>
                                            )}

                                            {deliveryType && deliveryType !== "DINE IN" && (
                                                <>
                                                    <div className='col-12 mb-2'>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Enter delivery address"
                                                            value={address}
                                                            onChange={(e) => setAddress(e.target.value)}
                                                            style={{ fontSize: "1rem", padding: "10px", width: "100%" }}
                                                        />
                                                    </div>
                                                    <div className='col-12 mb-2'>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Enter WhatsApp number"
                                                            value={whatsappNumber}
                                                            onChange={(e) => setWhatsappNumber(e.target.value)}
                                                            style={{ fontSize: "1rem", padding: "10px", width: "100%" }}
                                                        />
                                                    </div>
                                                    <div className='col-12 mb-2'>
                                                        <input
                                                            type="email"
                                                            className="form-control"
                                                            placeholder="Enter email"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            style={{ fontSize: "1rem", padding: "10px", width: "100%" }}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>

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
                                                        <th>Total</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-start">
                                                    {cartItems.map((item, index) => (
                                                        <tr key={index}>
                                                            <td className='text-start'>{tableNumber}</td>
                                                            <td className='text-start'>
                                                                {item.name}
                                                                {item.addonCounts && Object.keys(item.addonCounts).length > 0 && (
                                                                    <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#888" }}>
                                                                        {Object.entries(item.addonCounts).map(([addonName, { price, quantity, kitchen }]) => (
                                                                            <li key={addonName}>
                                                                                + {addonName} x{quantity} (${(price * quantity).toFixed(2)})
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                                {item.selectedCombos && item.selectedCombos.length > 0 && (
                                                                    <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#555" }}>
                                                                        {item.selectedCombos.map((combo, idx) => (
                                                                            <li key={idx}>
                                                                                + {combo.name1} x{combo.quantity || 1}
                                                                                {combo.selectedVariant ? ` (${combo.selectedVariant})` : ''}
                                                                                - ${(combo.selectedVariant ? (combo.variantPrice || 0) : (combo.combo_price || 0)) * (combo.quantity || 1).toFixed(2)}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-secondary btn-sm me-2"
                                                                    onClick={() => decreaseQuantity(item)}
                                                                    disabled={item.quantity <= 1}
                                                                >
                                                                    -
                                                                </button>
                                                                {item.quantity}
                                                                <button
                                                                    className="btn btn-secondary btn-sm ms-2"
                                                                    onClick={() => increaseQuantity(item)}
                                                                >
                                                                    +
                                                                </button>
                                                            </td>
                                                            <td className='text-start'>${item.basePrice}</td>
                                                            <td className='text-start'>
                                                                ${((item.basePrice * item.quantity) +
                                                                    Object.entries(item.addonCounts || {}).reduce((sum, [_, { price, quantity }]) => sum + (price * quantity), 0) +
                                                                    (item.selectedCombos || []).reduce((sum, combo) => sum + ((combo.combo_price || 0) + (combo.variantPrice || 0)) * (combo.quantity || 1), 0)
                                                                ).toFixed(2)}
                                                            </td>
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
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Totals and Buttons Section */}
                            <div className="row p-2 mt-2 border shadow rounded" style={{ flexShrink: 0 }}>
                                <div className="col-12">
                                    <div className="row">
                                        <div className="col-12 col-lg-6">
                                            <div className="row">
                                                <div className="col-md-6 mb-2 col-6">
                                                    <h5 className="mb-0" style={{ "fontSize": "12px" }}>Total Quantity</h5>
                                                    <div className='grand-tot-div justify-content-end'>
                                                        <span>{cartItems.reduce((total, item) => total + (item.quantity || 1), 0)}</span>
                                                    </div>
                                                </div>
                                                <div className="col-md-6 mb-2 col-6">
                                                    <h5 className="mb-0" style={{ "fontSize": "12px" }}>Subtotal</h5>
                                                    <div className='grand-tot-div'>
                                                        <span>$</span><span>{getSubTotal().toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                <div className="col-md-6 mb-2 col-6">
                                                    <h5 className="mb-0" style={{ "fontSize": "12px" }}>Tax</h5>
                                                    <div className='grand-tot-div justify-content-end'>
                                                        <span>${getTaxAmount().toFixed(2)} ({getTaxRate()}%)</span>
                                                    </div>
                                                </div>
                                                <div className="col-md-6 mb-2 col-6">
                                                    <h5 className="mb-0" style={{ "fontSize": "12px" }}>Grand Total</h5>
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
                                                                            <p><strong>{tableNumber ? "Table No" : "Delivery Type"}:</strong> {tableNumber || deliveryType}</p>
                                                                            <p><strong>Customer:</strong> {customerName}</p>
                                                                        </div>
                                                                        {deliveryType !== "DINE IN" && (
                                                                            <div className="mt-2">
                                                                                <p><strong>Address:</strong> {address || "N/A"}</p>
                                                                                <p><strong>WhatsApp:</strong> {whatsappNumber || "N/A"}</p>
                                                                                <p><strong>Email:</strong> {email || "N/A"}</p>
                                                                            </div>
                                                                        )}
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
                                                                                                    {Object.entries(item.addonCounts).map(([addonName, { price, quantity }]) => (
                                                                                                        <li key={addonName}>+ {addonName} x{quantity} (${(price * quantity).toFixed(2)})</li>
                                                                                                    ))}
                                                                                                </ul>
                                                                                            )}
                                                                                            {item.selectedCombos && item.selectedCombos.length > 0 && (
                                                                                                <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#555" }}>
                                                                                                    {item.selectedCombos.map((combo, idx) => (
                                                                                                        <li key={idx}>
                                                                                                            + {combo.name1} x{combo.quantity || 1}
                                                                                                            {combo.selectedVariant ? ` (${combo.selectedVariant})` : ''}
                                                                                                            - ${(combo.selectedVariant ? (combo.variantPrice || 0) : (combo.combo_price || 0)) * (combo.quantity || 1).toFixed(2)}
                                                                                                        </li>
                                                                                                    ))}
                                                                                                </ul>
                                                                                            )}
                                                                                        </td>
                                                                                        <td>{item.quantity || 1}</td>
                                                                                        <td>${item.basePrice}</td>
                                                                                        <td>
                                                                                            ${((item.basePrice * item.quantity) +
                                                                                                Object.entries(item.addonCounts || {}).reduce((sum, [_, { price, quantity }]) => sum + (price * quantity), 0) +
                                                                                                (item.selectedCombos || []).reduce((sum, combo) => sum + ((combo.combo_price || 0) + (combo.variantPrice || 0)) * (combo.quantity || 1), 0)
                                                                                            ).toFixed(2)}
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                        <div className="row mt-3">
                                                                            <div className="col-6 text-start"><strong>Total Quantity:</strong></div>
                                                                            <div className="col-6 text-end">{cartItems.reduce((total, item) => total + (item.quantity || 1), 0)}</div>
                                                                            <div className="col-6 text-start"><strong>Subtotal:</strong></div>
                                                                            <div className="col-6 text-end">${getSubTotal().toFixed(2)}</div>
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
                                                            <Button variant="secondary" className="w-100" onClick={() => handlePayment("CREDIT CARD")}>
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