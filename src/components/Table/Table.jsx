import React, { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./table.css";
import UserContext from "../../Context/UserContext";
import { v4 as uuidv4 } from "uuid";

function Table() {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { setCartItems } = useContext(UserContext);
    const [activeOrders, setActiveOrders] = useState([]); // [{ tableNumber, bookedChairs }]
    const [bookings, setBookings] = useState([]); // [{ table_number, booking_start_time, booking_end_time, customer_name, customer_phone, customer }]
    const [allItems, setAllItems] = useState([]);
    const [customers, setCustomers] = useState([]); // [{ name, customer_name, mobile_no }]
    const [showChairModal, setShowChairModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [chairCount, setChairCount] = useState(1);
    const [availableChairs, setAvailableChairs] = useState(0);
    const [bookingDetails, setBookingDetails] = useState({
        startTime: "",
        endTime: "",
        customer: "", // Customer ID
        isNewCustomer: false,
        newCustomer: {
            customer_name: "",
            mobile_no: "",
            primary_address: "",
            email_id: "",
            custom_watsapp_no: "",
        },
    });
    const [verificationCustomer, setVerificationCustomer] = useState(""); // Customer ID for verification
    const navigate = useNavigate();
    const { state } = useLocation();
    const { deliveryType } = state || {};

    // Fetch all items
    const fetchAllItems = async () => {
        try {
            const response = await fetch(
                "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_kyle_item_details",
                {
                    method: "GET",
                    headers: {
                        Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                        "Content-Type": "application/json",
                    },
                }
            );
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            let itemList = Array.isArray(data) ? data : (data.message && Array.isArray(data.message) ? data.message : []);
            if (!itemList.length) throw new Error("Invalid items data structure");

            const baseUrl = "http://109.199.100.136:6060/";
            setAllItems(
                itemList.map((item) => ({
                    ...item,
                    variants: item.variants
                        ? item.variants.map((v) => ({
                              type_of_variants: v.type_of_variants,
                              item_code: v.item_code || `${item.item_code}-${v.type_of_variants}`,
                              variant_price: parseFloat(v.variants_price) || 0,
                          }))
                        : [],
                    price_list_rate: parseFloat(item.price_list_rate) || 0,
                    image: item.image ? `${baseUrl}${item.image}` : "default-image.jpg",
                    custom_kitchen: item.custom_kitchen || "Unknown",
                    item_name: item.item_name || item.name,
                    has_variants: item.has_variants || false,
                }))
            );
        } catch (error) {
            console.error("Error fetching all items:", error);
            setAllItems([]);
        }
    };

    // Fetch customers
    const fetchCustomers = async () => {
        try {
            console.log("Starting fetchCustomers");
            const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_customers", {
                method: "GET",
                headers: {
                    Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                    "Content-Type": "application/json",
                },
            });
            const responseText = await response.text();
            console.log("Fetch Customers Raw Response:", responseText);
            
            if (!response.ok) throw new Error(`Failed to fetch customers: ${response.status} - ${responseText}`);
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`Invalid JSON response from get_customers: ${responseText}`);
            }
            
            console.log("Fetched Customers:", JSON.stringify(data, null, 2));
            setCustomers(data.message || data);
            console.log("fetchCustomers completed successfully");
        } catch (error) {
            console.error("Error fetching customers:", error.message, error.stack);
            setCustomers([]);
        }
    };

    // Fetch active POS Invoices
    const fetchActiveOrders = useCallback(async () => {
        try {
            const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoices", {
                method: "GET",
                headers: {
                    Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error(`Failed to fetch POS Invoices: ${response.status}`);
            const data = await response.json();
            console.log("Fetched POS Invoices Response:", JSON.stringify(data, null, 2));

            const result = data.message || data;
            if (result.status !== "success") throw new Error(result.message || "Unknown error");

            if (!result.data || !Array.isArray(result.data)) {
                console.warn("No valid POS Invoices data found.");
                setActiveOrders([]);
                return;
            }

            // Aggregate booked chairs per table
            const tableChairMap = {};
            result.data
                .filter((order) => order.custom_is_draft_without_payment === 1 || order.custom_is_draft_without_payment === "1")
                .forEach((order) => {
                    const tableNumber = String(order.custom_table_number);
                    const chairs = parseInt(order.custom_chair_count, 10) || 0;
                    if (tableNumber && chairs > 0) {
                        tableChairMap[tableNumber] = (tableChairMap[tableNumber] || 0) + chairs;
                    }
                });

            const activeTableOrders = Object.entries(tableChairMap).map(([tableNumber, bookedChairs]) => ({
                tableNumber,
                bookedChairs,
            }));
            console.log("Active Table Orders:", JSON.stringify(activeTableOrders, null, 2));
            setActiveOrders(activeTableOrders);
        } catch (error) {
            console.error("Error fetching POS Invoices:", error);
            setActiveOrders([]);
        }
    }, []);

    // Fetch active bookings
    const fetchBookings = useCallback(async () => {
        try {
            const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_table_bookings", {
                method: "GET",
                headers: {
                    Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error(`Failed to fetch bookings: ${response.status}`);
            const data = await response.json();
            console.log("Fetched Bookings Response:", JSON.stringify(data, null, 2));

            const result = data.message || data;
            if (result.status !== "success") throw new Error(result.message || "Unknown error");

            if (!result.data || !Array.isArray(result.data)) {
                console.warn("No valid bookings data found.");
                setBookings([]);
                return;
            }

            // Filter out expired bookings (end_time in the past)
            const currentTime = new Date();
            const activeBookings = result.data
                .filter((booking) => new Date(booking.booking_end_time) > currentTime)
                .map((booking) => ({
                    table_number: String(booking.table_number),
                    booking_start_time: booking.booking_start_time,
                    booking_end_time: booking.booking_end_time,
                    customer_name: booking.customer_name,
                    customer_phone: booking.customer_phone,
                    customer: booking.customer,
                }));
            console.log("Active Bookings:", JSON.stringify(activeBookings, null, 2));
            setBookings(activeBookings);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            setBookings([]);
        }
    }, []);

    useEffect(() => {
        const fetchTablesAndData = async () => {
            try {
                const tableResponse = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_table_details", {
                    headers: { Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a" },
                });
                if (!tableResponse.ok) throw new Error(`HTTP error! Status: ${tableResponse.status}`);
                const tableData = await tableResponse.json();
                console.log("Fetched Tables:", JSON.stringify(tableData, null, 2));
                setTables(tableData.message || tableData);

                await fetchAllItems();
                await fetchCustomers();
                await fetchActiveOrders();
                await fetchBookings();
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchTablesAndData();

        // Periodically refresh bookings to free expired ones
        const intervalId = setInterval(fetchBookings, 60000); // Every 1 minute
        return () => clearInterval(intervalId);
    }, [fetchActiveOrders, fetchBookings]);

    const getBookedChairs = (tableNumber) => {
        const order = activeOrders.find((o) => o.tableNumber === String(tableNumber));
        return order ? order.bookedChairs : 0;
    };

    const isTablePreBooked = (tableNumber) => {
        const currentTime = new Date();
        return bookings.find(
            (booking) =>
                booking.table_number === String(tableNumber) &&
                new Date(booking.booking_start_time) <= currentTime &&
                new Date(booking.booking_end_time) > currentTime
        );
    };

    const getBookingDetails = (tableNumber) => {
        return bookings.filter((booking) => booking.table_number === String(tableNumber));
    };

    const handleTableClick = (table) => {
        const bookedChairs = getBookedChairs(table.table_number);
        const available = table.number_of_chair - bookedChairs;
        const preBooked = isTablePreBooked(table.table_number);
        if (available <= 0) {
            alert("No chairs available for this table.");
            return;
        }
        if (preBooked) {
            setSelectedTable(table);
            setAvailableChairs(available);
            setVerificationCustomer("");
            setShowVerificationModal(true);
        } else {
            setSelectedTable(table);
            setAvailableChairs(available);
            setChairCount(1);
            setShowChairModal(true);
        }
    };

    const handleBookTableClick = (table) => {
        setSelectedTable(table);
        setBookingDetails({
            startTime: "",
            endTime: "",
            customer: "",
            isNewCustomer: false,
            newCustomer: {
                customer_name: "",
                mobile_no: "",
                primary_address: "",
                email_id: "",
                custom_watsapp_no: "",
            },
        });
        setShowBookingModal(true);
    };

    const handleVerifyCustomer = async () => {
        if (!selectedTable || !verificationCustomer) {
            alert("Please select a customer.");
            return;
        }

        try {
            const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.verify_booking", {
                method: "POST",
                headers: {
                    Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    table_number: selectedTable.table_number,
                    customer: verificationCustomer,
                }),
            });
            if (!response.ok) throw new Error(`Failed to verify booking: ${response.status}`);
            const data = await response.json();
            console.log("Verify Booking Response:", JSON.stringify(data, null, 2));

            const result = data.message || data;
            if (result.status !== "success") throw new Error(result.message || "Verification failed");

            // Find customer details for navigation
            const customer = customers.find((c) => c.name === verificationCustomer);
            const customerDetails = customer
                ? {
                      customer: customer.name,
                      customer_name: customer.customer_name,
                      customer_phone: customer.mobile_no || customer.custom_watsapp_no || "",
                      address: customer.primary_address || "",
                      email: customer.email_id || "",
                      watsappNumber: customer.custom_watsapp_no || customer.mobile_no || "",
                  }
                : {};

            setShowVerificationModal(false);
            setChairCount(1);
            setShowChairModal(true);
        } catch (error) {
            console.error("Error verifying booking:", error);
            alert(`Failed to verify customer: ${error.message}`);
        }
    };

    const handleChairSelection = async () => {
        if (!selectedTable || chairCount < 1 || chairCount > availableChairs) {
            alert(`Please select a valid number of chairs (1 to ${availableChairs}).`);
            return;
        }

        try {
            const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoices", {
                method: "GET",
                headers: {
                    Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error(`Failed to fetch POS Invoices: ${response.status}`);
            const data = await response.json();
            console.log("POS Invoices for Table", selectedTable.table_number, ":", JSON.stringify(data, null, 2));

            const result = data.message || data;
            if (result.status !== "success" || !result.data) throw new Error(result.message || "Invalid response");

            // Get customer details for pre-booked table
            let customerDetails = {};
            const preBooked = isTablePreBooked(selectedTable.table_number);
            if (preBooked && verificationCustomer) {
                const customer = customers.find((c) => c.name === verificationCustomer);
                if (customer) {
                    customerDetails = {
                        customer: customer.name,
                        customer_name: customer.customer_name,
                        customer_phone: customer.customer_phone || customer.mobile_no || customer.custom_watsapp_no || "",
                        address: customer.primary_address || "",
                        email: customer.email_id || "",
                        watsappNumber: customer.custom_watsapp_no || customer.mobile_no || "",
                    };
                }
            } else {
                // Check if the table has an active booking and get customer details
                const booking = bookings.find(
                    (b) =>
                        b.table_number === String(selectedTable.table_number) &&
                        new Date(b.booking_start_time) <= new Date() &&
                        new Date(b.booking_end_time) > new Date()
                );
                if (booking && booking.customer) {
                    const customer = customers.find((c) => c.name === booking.customer);
                    if (customer) {
                        customerDetails = {
                            customer: customer.name,
                            customer_name: customer.customer_name,
                            customer_phone: customer.customer_phone || customer.mobile_no || customer.custom_watsapp_no || "",
                            address: customer.primary_address || "",
                            email: customer.email_id || "",
                            watsappNumber: customer.custom_watsapp_no || customer.mobile_no || "",
                        };
                    }
                }
            }

            setShowChairModal(false);
            setCartItems([]);
            console.log(
                "Navigating to frontpage with state:",
                JSON.stringify({
                    tableNumber: selectedTable.table_number,
                    chairCount,
                    deliveryType: "DINE IN",
                    ...customerDetails,
                }, null, 2)
            );
            navigate("/frontpage", {
                state: {
                    tableNumber: selectedTable.table_number,
                    chairCount,
                    deliveryType: "DINE IN",
                    ...customerDetails,
                },
            });
        } catch (error) {
            console.error("Error fetching POS Invoice for table:", error);
            setCartItems([]);
            setShowChairModal(false);
            navigate("/frontpage", {
                state: {
                    tableNumber: selectedTable.table_number,
                    chairCount,
                    deliveryType: "DINE IN",
                },
            });
        }
    };

    const handleBookTable = async () => {
        console.log("Starting handleBookTable");
        if (!selectedTable) {
            console.error("No table selected");
            alert("No table selected.");
            return;
        }
        const { startTime, endTime, customer, isNewCustomer, newCustomer } = bookingDetails;
        if (!startTime || !endTime) {
            console.error("Missing start or end time");
            alert("Please fill in start and end times.");
            return;
        }
        if (new Date(endTime) <= new Date(startTime)) {
            console.error("Invalid time range");
            alert("End time must be after start time.");
            return;
        }
        if (!isNewCustomer && !customer) {
            console.error("No customer selected");
            alert("Please select a customer.");
            return;
        }
        if (isNewCustomer && !newCustomer.customer_name) {
            console.error("Missing customer name");
            alert("Please enter the new customer's name.");
            return;
        }
        if (isNewCustomer && newCustomer.mobile_no && !/^\+?\d{10,15}$/.test(newCustomer.mobile_no)) {
            console.error("Invalid phone number");
            alert("Please enter a valid phone number (10-15 digits).");
            return;
        }

        try {
            let customerId = customer;
            if (isNewCustomer) {
                console.log("Entering isNewCustomer branch");
                // Log the new customer payload
                console.log("Creating new customer with payload:", JSON.stringify(newCustomer, null, 2));
                
                const customerResponse = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.create_customer", {
                    method: "POST",
                    headers: {
                        Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        customer_name: newCustomer.customer_name,
                        phone: newCustomer.mobile_no || null,
                        address: newCustomer.primary_address || null,
                        email: newCustomer.email_id || null,
                        whatsapp_number: newCustomer.custom_watsapp_no || null
                    }),
                });
                const customerResponseText = await customerResponse.text();
                console.log("Create Customer Raw Response:", customerResponseText);
                
                if (!customerResponse.ok) {
                    console.error("Customer creation failed with status:", customerResponse.status);
                    throw new Error(`Failed to create customer: ${customerResponse.status} - ${customerResponseText}`);
                }
                
                let customerData;
                try {
                    customerData = JSON.parse(customerResponseText);
                } catch (e) {
                    console.error("Failed to parse customer response:", e.message);
                    throw new Error(`Invalid JSON response from create_customer: ${customerResponseText}`);
                }
                
                console.log("Create Customer Response:", JSON.stringify(customerData, null, 2));
                
                // Check the correct status field
                if (customerData.message?.status !== "success") {
                    console.error("Customer creation failed:", JSON.stringify(customerData.message || customerData));
                    throw new Error(customerData.message?.message || "Customer creation failed");
                }
                customerId = customerData.message.customer_id;
                console.log("Customer created with ID:", customerId);
            } else {
                console.log("Using existing customer ID:", customerId);
            }

            console.log("Preparing booking payload");
            // Log the booking payload
            const bookingPayload = {
                table_number: selectedTable.table_number,
                booking_start_time: startTime.replace("T", " ") + ":00",
                booking_end_time: endTime.replace("T", " ") + ":00",
                customer: customerId,
            };
            console.log("Booking table with payload:", JSON.stringify(bookingPayload, null, 2));
            
            // Book table with retries
            console.log("Starting book_table API call");
            let bookingSuccess = false;
            let bookingData;
            for (let attempt = 1; attempt <= 3; attempt++) {
                console.log(`Book table attempt ${attempt}`);
                const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.book_table", {
                    method: "POST",
                    headers: {
                        Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(bookingPayload),
                });
                const responseText = await response.text();
                console.log(`Book Table Raw Response (Attempt ${attempt}):`, responseText);
                
                if (!response.ok) {
                    console.error(`Book Table failed on attempt ${attempt}: ${response.status} - ${responseText}`);
                    if (attempt === 3) {
                        throw new Error(`Failed to book table after ${attempt} attempts: ${response.status} - ${responseText}`);
                    }
                    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
                    continue;
                }
                
                try {
                    bookingData = JSON.parse(responseText);
                } catch (e) {
                    console.error("Failed to parse book_table response:", e.message);
                    throw new Error(`Invalid JSON response from book_table: ${responseText}`);
                }
                
                console.log(`Book Table Response (Attempt ${attempt}):`, JSON.stringify(bookingData, null, 2));
                
                const result = bookingData.message || bookingData;
                if (result.status === "success") {
                    bookingSuccess = true;
                    break;
                }
                
                console.error(`Book Table failed on attempt ${attempt}: ${result.message || "Unknown error"}`);
                if (attempt === 3) {
                    throw new Error(`Failed to book table after ${attempt} attempts: ${result.message || "Unknown error"}`);
                }
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
            }
            
            if (!bookingSuccess) {
                console.error("All booking attempts failed");
                throw new Error("Failed to book table after all retries.");
            }

            console.log("Booking successful");
            alert(`Table ${selectedTable.table_number} booked successfully!`);
            setShowBookingModal(false);
            setBookingDetails({
                startTime: "",
                endTime: "",
                customer: "",
                isNewCustomer: false,
                newCustomer: {
                    customer_name: "",
                    mobile_no: "",
                    primary_address: "",
                    email_id: "",
                    custom_watsapp_no: "",
                },
            });
            await fetchBookings(); // Refresh bookings
            console.log("handleBookTable completed successfully");
        } catch (error) {
            console.error("Error booking table:", error.message, error.stack);
            alert(`Failed to book table: ${error.message}`);
        }
    };

    if (loading) return <div>Loading tables...</div>;
    if (error) return <div>Error: {error}</div>;

    console.log("Rendering tables with activeOrders:", activeOrders, "bookings:", bookings, "customers:", customers);

    return (
        <>
            <div className="table-page container">
                <i className="fi fi-rs-angle-small-left back-button1" onClick={() => navigate("/firsttab")}></i>
                <div className="table-grid">
                    {tables.length > 0 ? (
                        tables.map((table, index) => {
                            const bookedChairs = getBookedChairs(table.table_number);
                            const availableChairs = table.number_of_chair - bookedChairs;
                            const preBooked = isTablePreBooked(table.table_number);
                            const bookingInfo = getBookingDetails(table.table_number);
                            const statusClass = preBooked
                                ? "pre-booked"
                                : bookedChairs > 0
                                ? availableChairs > 0
                                    ? "partially-booked"
                                    : "booked"
                                : "available";
                            return (
                                <div key={index} className={`table-card ${statusClass}`}>
                                    <h2>T{table.table_number}</h2>
                                    <div className="chairs-container">
                                        {Array.from({ length: table.number_of_chair }).map((_, chairIndex) => (
                                            <i
                                                key={chairIndex}
                                                className={`fa-solid fa-chair chair-icon ${
                                                    chairIndex < bookedChairs ? "booked-chair" : ""
                                                }`}
                                            ></i>
                                        ))}
                                    </div>
                                    <p className="chair-status">
                                        {availableChairs} of {table.number_of_chair} chairs available
                                    </p>
                                    {bookingInfo.length > 0 && (
                                        <p className="booking-status">
                                            {bookingInfo.map((booking, idx) => (
                                                <span key={idx}>
                                                    Pre-booked: {new Date(booking.booking_start_time).toLocaleString()} to{" "}
                                                    {new Date(booking.booking_end_time).toLocaleString()}
                                                    <br />
                                                    By: {booking.customer_name} ({booking.customer_phone})
                                                    <br />
                                                </span>
                                            ))}
                                        </p>
                                    )}
                                    <div className="table-actions">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleTableClick(table)}
                                        >
                                            Select Table
                                        </button>
                                        {deliveryType === "TABLE BOOKING" && (
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => handleBookTableClick(table)}
                                            >
                                                Book Table
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div>No tables available.</div>
                    )}
                </div>
            </div>

            {/* Chair Selection Modal */}
            {showChairModal && selectedTable && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Select Chairs for Table {selectedTable.table_number}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowChairModal(false)}
                                    aria-label="Close"
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>
                                    Available chairs: {availableChairs} of {selectedTable.number_of_chair}
                                </p>
                                <div className="mb-3">
                                    <label htmlFor="chairCount" className="form-label">
                                        Number of Chairs:
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="chairCount"
                                        min="1"
                                        max={availableChairs}
                                        value={chairCount}
                                        onChange={(e) => setChairCount(parseInt(e.target.value, 10) || 1)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowChairModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleChairSelection}
                                    disabled={chairCount < 1 || chairCount > availableChairs}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {showBookingModal && selectedTable && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Book Table {selectedTable.table_number}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowBookingModal(false)}
                                    aria-label="Close"
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label htmlFor="startTime" className="form-label">
                                        Booking Start Time:
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="form-control"
                                        id="startTime"
                                        value={bookingDetails.startTime}
                                        onChange={(e) =>
                                            setBookingDetails({ ...bookingDetails, startTime: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="endTime" className="form-label">
                                        Booking End Time:
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="form-control"
                                        id="endTime"
                                        value={bookingDetails.endTime}
                                        onChange={(e) =>
                                            setBookingDetails({ ...bookingDetails, endTime: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Customer Selection:</label>
                                    <div className="form-check">
                                        <input
                                            type="radio"
                                            className="form-check-input"
                                            id="existingCustomer"
                                            checked={!bookingDetails.isNewCustomer}
                                            onChange={() =>
                                                setBookingDetails({ ...bookingDetails, isNewCustomer: false })
                                            }
                                        />
                                        <label className="form-check-label" htmlFor="existingCustomer">
                                            Select Existing Customer
                                        </label>
                                    </div>
                                    <div className="form-check">
                                        <input
                                            type="radio"
                                            className="form-check-input"
                                            id="newCustomer"
                                            checked={bookingDetails.isNewCustomer}
                                            onChange={() =>
                                                setBookingDetails({ ...bookingDetails, isNewCustomer: true })
                                            }
                                        />
                                        <label className="form-check-label" htmlFor="newCustomer">
                                            Create New Customer
                                        </label>
                                    </div>
                                </div>
                                {!bookingDetails.isNewCustomer ? (
                                    <div className="mb-3">
                                        <label htmlFor="customer" className="form-label">
                                            Customer:
                                        </label>
                                        <select
                                            className="form-control"
                                            id="customer"
                                            value={bookingDetails.customer}
                                            onChange={(e) =>
                                                setBookingDetails({ ...bookingDetails, customer: e.target.value })
                                            }
                                            required
                                        >
                                            <option value="">Select a customer</option>
                                            {customers.map((customer) => (
                                                <option key={customer.name} value={customer.name}>
                                                    {customer.customer_name} ({customer.mobile_no || "No phone"})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-3">
                                            <label htmlFor="newCustomerName" className="form-label">
                                                Customer Name:
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="newCustomerName"
                                                value={bookingDetails.newCustomer.customer_name}
                                                onChange={(e) =>
                                                    setBookingDetails({
                                                        ...bookingDetails,
                                                        newCustomer: {
                                                            ...bookingDetails.newCustomer,
                                                            customer_name: e.target.value,
                                                        },
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="newCustomerPhone" className="form-label">
                                                Mobile Number:
                                            </label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                id="newCustomerPhone"
                                                value={bookingDetails.newCustomer.mobile_no}
                                                onChange={(e) =>
                                                    setBookingDetails({
                                                        ...bookingDetails,
                                                        newCustomer: {
                                                            ...bookingDetails.newCustomer,
                                                            mobile_no: e.target.value,
                                                        },
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="newCustomerAddress" className="form-label">
                                                Address:
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="newCustomerAddress"
                                                value={bookingDetails.newCustomer.primary_address}
                                                onChange={(e) =>
                                                    setBookingDetails({
                                                        ...bookingDetails,
                                                        newCustomer: {
                                                            ...bookingDetails.newCustomer,
                                                            primary_address: e.target.value,
                                                        },
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="newCustomerEmail" className="form-label">
                                                Email:
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                id="newCustomerEmail"
                                                value={bookingDetails.newCustomer.email_id}
                                                onChange={(e) =>
                                                    setBookingDetails({
                                                        ...bookingDetails,
                                                        newCustomer: {
                                                            ...bookingDetails.newCustomer,
                                                            email_id: e.target.value,
                                                        },
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="newCustomerWhatsApp" className="form-label">
                                                WhatsApp Number:
                                            </label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                id="newCustomerWhatsApp"
                                                value={bookingDetails.newCustomer.custom_watsapp_no}
                                                onChange={(e) =>
                                                    setBookingDetails({
                                                        ...bookingDetails,
                                                        newCustomer: {
                                                            ...bookingDetails.newCustomer,
                                                            custom_watsapp_no: e.target.value,
                                                        },
                                                    })
                                                }
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowBookingModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleBookTable}
                                >
                                    Book Table
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Verification Modal */}
            {showVerificationModal && selectedTable && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Verify Customer for Table {selectedTable.table_number}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowVerificationModal(false)}
                                    aria-label="Close"
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>This table is pre-booked. Please select the customer to verify.</p>
                                <div className="mb-3">
                                    <label htmlFor="verificationCustomer" className="form-label">
                                        Customer:
                                    </label>
                                    <select
                                        className="form-control"
                                        id="verificationCustomer"
                                        value={verificationCustomer}
                                        onChange={(e) => setVerificationCustomer(e.target.value)}
                                        required
                                    >
                                        <option value="">Select a customer</option>
                                        {customers.map((customer) => (
                                            <option key={customer.name} value={customer.name}>
                                                {customer.customer_name} ({customer.mobile_no || "No phone"})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowVerificationModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleVerifyCustomer}
                                >
                                    Verify
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Table;

