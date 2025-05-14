import React, { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./table.css";
import UserContext from "../../Context/UserContext";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center mt-5 text-danger">
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message || "Unknown error occurred."}</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Table() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setCartItems } = useContext(UserContext);
  const [activeOrders, setActiveOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showChairModal, setShowChairModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedChairs, setSelectedChairs] = useState([]);
  const [availableChairsList, setAvailableChairsList] = useState([]);
  const [totalChairs, setTotalChairs] = useState(0);
  const [preBookedChairs, setPreBookedChairs] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({
    startTime: "",
    endTime: "",
    customer: "",
    chairs: [],
    isNewCustomer: false,
    newCustomer: {
      customer_name: "",
      mobile_no: "",
      primary_address: "",
      email_id: "",
      custom_watsapp_no: "",
    },
  });
  const [verificationCustomer, setVerificationCustomer] = useState("");
  const navigate = useNavigate();
  const { state } = useLocation();
  const { deliveryType } = state || {};

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
      let itemList = Array.isArray(data)
        ? data
        : data.message && Array.isArray(data.message)
        ? data.message
        : [];
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

  const fetchCustomers = async () => {
    try {
      const response = await fetch(
        "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_customers",
        {
          method: "GET",
          headers: {
            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok)
        throw new Error(`Failed to fetch customers: ${response.status}`);
      const data = await response.json();
      setCustomers(
        Array.isArray(data.message)
          ? data.message
          : Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    }
  };

  const fetchActiveOrders = useCallback(
    async (retryCount = 5, delay = 2000) => {
      const attemptFetch = async (attemptsLeft) => {
        try {
          const response = await fetch(
            "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoices",
            {
              method: "GET",
              headers: {
                Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                "Content-Type": "application/json",
              },
            }
          );
          if (!response.ok)
            throw new Error(`Failed to fetch POS Invoices: ${response.status}`);
          const data = await response.json();
          console.log(
            "Fetched POS Invoices Response (Attempt " +
              (retryCount - attemptsLeft + 1) +
              "):",
            JSON.stringify(data, null, 2)
          );

          const result = data.message || data;
          if (result.status !== "success")
            throw new Error(result.message || "Unknown error");

          if (!result.data || !Array.isArray(result.data)) {
            console.warn("No valid POS Invoices data found.");
            setActiveOrders([]);
            return;
          }

          const tableChairMap = {};
          result.data
            .filter((order) => {
              const isDraft = order.custom_is_draft_without_payment == 1;
              console.log(
                `Order for Table ${order.custom_table_number}: isDraft=${isDraft}, custom_is_draft_without_payment=${order.custom_is_draft_without_payment}, docstatus=${order.docstatus}`
              );
              return order.docstatus !== 2 && isDraft;
            })
            .forEach((order) => {
              const tableNumber = String(order.custom_table_number);
              const chairs = parseInt(order.custom_chair_count, 10) || 0;
              let chairNumbers = [];
              if (order.custom_chair_numbers) {
                if (Array.isArray(order.custom_chair_numbers)) {
                  chairNumbers = order.custom_chair_numbers
                    .map((num) => parseInt(num))
                    .filter((num) => !isNaN(num));
                } else if (
                  typeof order.custom_chair_numbers === "string" &&
                  order.custom_chair_numbers.trim() !== ""
                ) {
                  chairNumbers = order.custom_chair_numbers
                    .split(",")
                    .map((num) => parseInt(num.trim()))
                    .filter((num) => !isNaN(num));
                }
              }
              if (chairNumbers.length === 0 && chairs > 0) {
                chairNumbers = Array.from({ length: chairs }, (_, i) => i + 1);
              }
              if (tableNumber && chairs > 0 && chairNumbers.length > 0) {
                if (tableChairMap[tableNumber]) {
                  tableChairMap[tableNumber].bookedChairs += chairs;
                  tableChairMap[tableNumber].chairNumbers = [
                    ...new Set([
                      ...tableChairMap[tableNumber].chairNumbers,
                      ...chairNumbers,
                    ]),
                  ].sort((a, b) => a - b);
                } else {
                  tableChairMap[tableNumber] = {
                    bookedChairs: chairs,
                    chairNumbers: chairNumbers,
                  };
                }
                console.log(
                  `Processed order for Table ${tableNumber}: ${chairs} chairs, Chair Numbers: ${chairNumbers.join(
                    ", "
                  )}`
                );
              } else {
                console.warn(
                  `Skipped order for Table ${tableNumber}: Invalid data (chairs=${chairs}, chairNumbers=${chairNumbers})`
                );
              }
            });

          const activeTableOrders = Object.entries(tableChairMap).map(
            ([tableNumber, { bookedChairs, chairNumbers }]) => ({
              tableNumber,
              bookedChairs,
              chairNumbers,
            })
          );
          console.log(
            "Active Table Orders:",
            JSON.stringify(activeTableOrders, null, 2)
          );
          setActiveOrders(activeTableOrders);
        } catch (error) {
          console.error(
            "Error fetching POS Invoices (Attempt " +
              (retryCount - attemptsLeft + 1) +
              "):",
            error
          );
          if (attemptsLeft > 1) {
            console.log(
              `Retrying fetchActiveOrders... (${attemptsLeft - 1} attempts left)`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            await attemptFetch(attemptsLeft - 1);
          } else {
            console.error("All retry attempts failed for fetchActiveOrders.");
            setActiveOrders([]);
          }
        }
      };

      await attemptFetch(retryCount);
    },
    []
  );

  const fetchBookings = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_table_bookings",
        {
          method: "GET",
          headers: {
            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok)
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      const data = await response.json();
      const result = data.message || data;
      if (result.status !== "success")
        throw new Error(result.message || "Unknown error");

      if (!result.data || !Array.isArray(result.data)) {
        setBookings([]);
        return;
      }

      const currentTime = new Date();
      const activeBookings = result.data
        .filter((booking) => new Date(booking.booking_end_time) > currentTime)
        .map((booking) => ({
          table_number: String(booking.table_number),
          booking_start_time: booking.booking_start_time,
          booking_end_time: booking.booking_end_time,
          customer_name: booking.customer_name || "Unknown",
          customer_phone: booking.customer_phone || "",
          customer: booking.customer || "",
          chair_count: parseInt(booking.chair_count, 10) || 1,
          chair_numbers: booking.chair_numbers
            ? Array.isArray(booking.chair_numbers)
              ? booking.chair_numbers
                  .map((num) => parseInt(num))
                  .filter((num) => !isNaN(num))
              : typeof booking.chair_numbers === "string" &&
                booking.chair_numbers.trim() !== ""
              ? booking.chair_numbers
                  .split(",")
                  .map((num) => parseInt(num.trim()))
                  .filter((num) => !isNaN(num))
              : Array.from(
                  { length: parseInt(booking.chair_count, 10) || 1 },
                  (_, i) => i + 1
                )
            : Array.from(
                { length: parseInt(booking.chair_count, 10) || 1 },
                (_, i) => i + 1
              ),
        }));
      setBookings(activeBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    }
  }, []);

  useEffect(() => {
    const fetchTablesAndData = async () => {
      try {
        const tableResponse = await fetch(
          "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_table_details",
          {
            headers: { Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a" },
          }
        );
        if (!tableResponse.ok)
          throw new Error(`HTTP error! Status: ${tableResponse.status}`);
        const tableData = await tableResponse.json();

        let tableList = [];
        if (Array.isArray(tableData)) {
          tableList = tableData;
        } else if (tableData.message && Array.isArray(tableData.message)) {
          tableList = tableData.message;
        } else if (tableData.data && Array.isArray(tableData.data)) {
          tableList = tableData.data;
        } else if (
          tableData.message &&
          tableData.message.data &&
          Array.isArray(tableData.message.data)
        ) {
          tableList = tableData.message.data;
        } else {
          throw new Error("Invalid table data structure");
        }

        setTables(tableList.length ? tableList : []);

        if (state?.optimisticOrder) {
          const { tableNumber, chairCount, chairNumbers } = state.optimisticOrder;
          setActiveOrders((prev) => {
            const existingOrderIndex = prev.findIndex(
              (order) => order.tableNumber === String(tableNumber)
            );
            const newOrder = {
              tableNumber: String(tableNumber),
              bookedChairs: chairCount,
              chairNumbers: chairNumbers,
            };
            if (existingOrderIndex >= 0) {
              const updatedOrders = [...prev];
              updatedOrders[existingOrderIndex] = {
                ...updatedOrders[existingOrderIndex],
                bookedChairs:
                  updatedOrders[existingOrderIndex].bookedChairs + chairCount,
                chairNumbers: [
                  ...new Set([
                    ...updatedOrders[existingOrderIndex].chairNumbers,
                    ...chairNumbers,
                  ]),
                ].sort((a, b) => a - b),
              };
              return updatedOrders;
            }
            return [...prev, newOrder];
          });
        }

        if (state?.clearTable) {
          const { tableNumber } = state.clearTable;
          setActiveOrders((prev) =>
            prev.filter((order) => order.tableNumber !== String(tableNumber))
          );
        }

        await Promise.all([
          fetchAllItems(),
          fetchCustomers(),
          fetchActiveOrders(),
          fetchBookings(),
        ]);
        setLoading(false);

        await fetchActiveOrders();

        if (state?.savedInvoice || state?.clearTable) {
          console.log(
            "Detected saved invoice or paid invoice, scheduling fallback fetchActiveOrders..."
          );
          const timeoutId = setTimeout(async () => {
            console.log("Executing fallback fetchActiveOrders...");
            await fetchActiveOrders();
          }, 3000);
          return () => clearTimeout(timeoutId);
        }
      } catch (err) {
        console.error("Error in fetchTablesAndData:", err);
        setError(`Failed to load tables: ${err.message}`);
        setTables([]);
        setLoading(false);
      }
    };

    fetchTablesAndData();
    const intervalId = setInterval(fetchBookings, 60000);
    return () => clearInterval(intervalId);
  }, [fetchActiveOrders, fetchBookings, state]);

  const getBookedChairs = (tableNumber) => {
    const order = activeOrders.find(
      (o) => o.tableNumber === String(tableNumber)
    );
    const orderChairs = order ? order.bookedChairs : 0;
    const currentTime = new Date();
    const bookingChairs = bookings
      .filter(
        (booking) =>
          booking.table_number === String(tableNumber) &&
          new Date(booking.booking_start_time) <= currentTime &&
          new Date(booking.booking_end_time) > currentTime
      )
      .reduce(
        (total, booking) => total + (parseInt(booking.chair_count, 10) || 0),
        0
      );
    return orderChairs + bookingChairs;
  };

  const getBookedChairNumbers = (tableNumber) => {
    const order = activeOrders.find(
      (o) => o.tableNumber === String(tableNumber)
    );
    const orderChairNumbers = order && order.chairNumbers ? order.chairNumbers : [];
    const currentTime = new Date();
    const bookingChairNumbers = bookings
      .filter(
        (booking) =>
          booking.table_number === String(tableNumber) &&
          new Date(booking.booking_start_time) <= currentTime &&
          new Date(booking.booking_end_time) > currentTime
      )
      .flatMap((booking) => booking.chair_numbers || []);
    return [...new Set([...orderChairNumbers, ...bookingChairNumbers])].sort(
      (a, b) => a - b
    );
  };

  const getAvailableChairNumbers = (tableNumber, totalChairs, startTime, endTime) => {
    const bookedChairNumbers = getBookedChairNumbers(tableNumber);
    const currentTime = new Date();
    const proposedStartTime = startTime ? new Date(startTime) : null;
    const proposedEndTime = endTime ? new Date(endTime) : null;

    const overlappingBookingChairNumbers = bookings
      .filter((booking) => {
        if (booking.table_number !== String(tableNumber)) return false;
        const existingStart = new Date(booking.booking_start_time);
        const existingEnd = new Date(booking.booking_end_time);
        const bufferStart = new Date(existingStart.getTime() - 1800000);
        return (
          proposedStartTime &&
          proposedEndTime &&
          proposedStartTime <= existingEnd &&
          proposedEndTime >= bufferStart &&
          (existingStart > currentTime || existingEnd > currentTime)
        );
      })
      .flatMap((booking) => booking.chair_numbers || []);

    const totalOccupiedChairs = [
      ...new Set([...bookedChairNumbers, ...overlappingBookingChairNumbers]),
    ];
    const availableChairs = [];
    for (let i = 1; i <= totalChairs; i++) {
      if (!totalOccupiedChairs.includes(i)) {
        availableChairs.push(i);
      }
    }
    return availableChairs.sort((a, b) => a - b);
  };

  const getBookingDetails = (tableNumber) => {
    const currentTime = new Date();
    return bookings.filter(
      (booking) =>
        booking.table_number === String(tableNumber) &&
        new Date(booking.booking_end_time) > currentTime
    );
  };

  const isTablePreBooked = (tableNumber, totalChairs) => {
    const currentTime = new Date();
    const bufferTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    const relevantBookings = bookings.filter(
      (booking) =>
        booking.table_number === String(tableNumber) &&
        new Date(booking.booking_start_time) <= bufferTime &&
        new Date(booking.booking_end_time) > currentTime
    );
    const totalBookedChairs = relevantBookings.reduce(
      (total, booking) => total + (parseInt(booking.chair_count, 10) || 0),
      0
    );
    return totalBookedChairs >= totalChairs;
  };

  const handleTableClick = (table) => {
    const availableChairs = getAvailableChairNumbers(
      table.table_number,
      table.number_of_chair
    );
    if (availableChairs.length === 0) {
      alert("No chairs available for this table. Please check active bookings.");
      return;
    }
    setSelectedTable(table);
    setAvailableChairsList(availableChairs);
    setTotalChairs(table.number_of_chair);
    setSelectedChairs([]);
    setShowChairModal(true);
  };

  const handleViewBookings = (table) => {
    const bookingInfo = getBookingDetails(table.table_number);
    if (bookingInfo.length === 0) {
      alert("No active bookings found for this table.");
      return;
    }
    setSelectedTable(table);
    setShowBookingsModal(true);
  };

  const handleBookingSelection = (booking) => {
    setSelectedBooking(booking);
    setPreBookedChairs(booking.chair_numbers || []);
    setVerificationCustomer("");
    setShowBookingsModal(false);
    setShowVerificationModal(true);
  };

  const handleBookTableClick = (table) => {
    const availableChairs = getAvailableChairNumbers(
      table.table_number,
      table.number_of_chair
    );
    setSelectedTable(table);
    setAvailableChairsList(availableChairs);
    setTotalChairs(table.number_of_chair);
    setBookingDetails({
      startTime: "",
      endTime: "",
      customer: "",
      chairs: [],
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
    if (!selectedTable || !verificationCustomer || !selectedBooking) {
      alert("Please select a customer and booking.");
      return;
    }
    try {
      const response = await fetch(
        "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.verify_booking",
        {
          method: "POST",
          headers: {
            Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            table_number: selectedTable.table_number,
            customer: verificationCustomer,
          }),
        }
      );
      if (!response.ok)
        throw new Error(`Failed to verify booking: ${response.status}`);
      const data = await response.json();
      const result = data.message || data;
      if (result.status !== "success")
        throw new Error(result.message || "Verification failed");

      const customer =
        customers.find((c) => c.name === verificationCustomer) || {};
      setShowVerificationModal(false);
      setCartItems([]);
      navigate("/frontpage", {
        state: {
          tableNumber: selectedTable.table_number,
          chairNumbers: selectedBooking.chair_numbers,
          chairCount: selectedBooking.chair_numbers.length,
          deliveryType: "DINE IN",
          customer: customer.name || "",
          customer_name: customer.customer_name || "",
          customer_phone:
            customer.mobile_no || customer.custom_watsapp_no || "",
          address: customer.primary_address || "",
          email: customer.email_id || "",
          watsappNumber:
            customer.custom_watsapp_no || customer.mobile_no || "",
        },
      });
    } catch (error) {
      console.error("Error verifying booking:", error);
      alert(`Failed to verify customer: ${error.message}`);
    }
  };

  const toggleChair = (chairNumber) => {
    setSelectedChairs((prev) =>
      prev.includes(chairNumber)
        ? prev.filter((num) => num !== chairNumber)
        : [...prev, chairNumber].sort((a, b) => a - b)
    );
  };

  const toggleBookingChair = (chairNumber) => {
    setBookingDetails((prev) => ({
      ...prev,
      chairs: prev.chairs.includes(chairNumber)
        ? prev.chairs.filter((num) => num !== chairNumber)
        : [...prev.chairs, chairNumber].sort((a, b) => a - b),
    }));
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails((prev) => ({ ...prev, [name]: value }));
    if (name === "startTime" || name === "endTime") {
      const availableChairs = getAvailableChairNumbers(
        selectedTable.table_number,
        selectedTable.number_of_chair,
        name === "startTime" ? value : bookingDetails.startTime,
        name === "endTime" ? value : bookingDetails.endTime
      );
      setAvailableChairsList(availableChairs);
    }
  };

  const handleChairSelection = async () => {
    if (!selectedTable || selectedChairs.length === 0) {
      alert("Please select at least one chair.");
      return;
    }
    const invalidChairs = selectedChairs.filter(
      (chair) => !availableChairsList.includes(chair)
    );
    if (invalidChairs.length > 0) {
      alert(
        `Chairs ${invalidChairs.join(
          ", "
        )} are currently occupied by other active orders or bookings.`
      );
      return;
    }
    const outOfRangeChairs = selectedChairs.filter(
      (chair) => chair < 1 || chair > totalChairs
    );
    if (outOfRangeChairs.length > 0) {
      alert(
        `Chairs ${outOfRangeChairs.join(
          ", "
        )} are out of range for Table ${selectedTable.table_number} (1-${totalChairs}).`
      );
      return;
    }

    try {
      const optimisticOrder = {
        tableNumber: String(selectedTable.table_number),
        bookedChairs: selectedChairs.length,
        chairNumbers: selectedChairs,
      };
      setActiveOrders((prev) => {
        const existingOrderIndex = prev.findIndex(
          (order) => order.tableNumber === optimisticOrder.tableNumber
        );
        if (existingOrderIndex >= 0) {
          const updatedOrders = [...prev];
          updatedOrders[existingOrderIndex] = {
            ...updatedOrders[existingOrderIndex],
            bookedChairs:
              updatedOrders[existingOrderIndex].bookedChairs +
              optimisticOrder.bookedChairs,
            chairNumbers: [
              ...new Set([
                ...updatedOrders[existingOrderIndex].chairNumbers,
                ...optimisticOrder.chairNumbers,
              ]),
            ].sort((a, b) => a - b),
          };
          return updatedOrders;
        }
        return [...prev, optimisticOrder];
      });

      setShowChairModal(false);
      setCartItems([]);
      navigate("/frontpage", {
        state: {
          tableNumber: selectedTable.table_number,
          chairNumbers: selectedChairs,
          chairCount: selectedChairs.length,
          deliveryType: "DINE IN",
        },
      });

      setTimeout(async () => {
        console.log("Re-fetching active orders after chair selection...");
        await fetchActiveOrders();
      }, 1000);
    } catch (error) {
      console.error("Error in chair selection:", error);
      setActiveOrders((prev) =>
        prev.filter(
          (order) =>
            order.tableNumber !== String(selectedTable.table_number) ||
            !order.chairNumbers.every((num) => selectedChairs.includes(num))
        )
      );
      alert(`Failed to process chair selection: ${error.message}`);
    }
  };

  const handleBookTable = async () => {
    if (!selectedTable) {
      alert("No table selected.");
      return;
    }
    const { startTime, endTime, customer, chairs, isNewCustomer, newCustomer } =
      bookingDetails;
    if (!startTime || !endTime) {
      alert("Please fill in start and end times.");
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      alert("End time must be after start time.");
      return;
    }
    if (!isNewCustomer && !customer) {
      alert("Please select a customer.");
      return;
    }
    if (isNewCustomer && !newCustomer.customer_name) {
      alert("Please enter the new customer's name.");
      return;
    }
    if (
      isNewCustomer &&
      newCustomer.mobile_no &&
      !/^\+?\d{10,15}$/.test(newCustomer.mobile_no)
    ) {
      alert("Please enter a valid phone number (10-15 digits).");
      return;
    }
    if (chairs.length === 0) {
      alert("Please select at least one chair.");
      return;
    }
    const table = tables.find(
      (t) => t.table_number === selectedTable.table_number
    );
    if (!table) {
      alert("Selected table not found.");
      return;
    }
    const availableChairs = getAvailableChairNumbers(
      table.table_number,
      table.number_of_chair,
      startTime,
      endTime
    );
    const invalidChairs = chairs.filter((chair) => !availableChairs.includes(chair));
    if (invalidChairs.length > 0) {
      alert(
        `Chairs ${invalidChairs.join(
          ", "
        )} are not available for the selected time slot.`
      );
      return;
    }
    const outOfRangeChairs = chairs.filter(
      (chair) => chair < 1 || chair > table.number_of_chair
    );
    if (outOfRangeChairs.length > 0) {
      alert(
        `Chairs ${outOfRangeChairs.join(
          ", "
        )} are out of range for Table ${table.table_number} (1-${table.number_of_chair}).`
      );
      return;
    }

    try {
      let customerId = customer;
      let customerName = "";
      let customerPhone = "";
      if (isNewCustomer) {
        const customerResponse = await fetch(
          "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.create_customer",
          {
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
              whatsapp_number: newCustomer.custom_watsapp_no || null,
            }),
          }
        );
        if (!customerResponse.ok)
          throw new Error(`Failed to create customer: ${customerResponse.status}`);
        const customerData = await customerResponse.json();
        if (customerData.message?.status !== "success")
          throw new Error(
            customerData.message?.message || "Customer creation failed"
          );
        customerId = customerData.message.customer_id;
        customerName = newCustomer.customer_name;
        customerPhone = newCustomer.mobile_no || newCustomer.custom_watsapp_no || "";
      } else {
        const selectedCustomer = customers.find((c) => c.name === customer);
        if (!selectedCustomer) throw new Error("Selected customer not found.");
        customerName = selectedCustomer.customer_name || "";
        customerPhone =
          selectedCustomer.mobile_no || selectedCustomer.custom_watsapp_no || "";
      }

      const chairCount = chairs.length;
      const bookingPayload = {
        table_number: selectedTable.table_number,
        booking_start_time: startTime.replace("T", " ") + ":00",
        booking_end_time: endTime.replace("T", " ") + ":00",
        customer: customerId,
        chair_count: chairCount,
        chair_numbers: chairs,
      };

      const optimisticBooking = {
        table_number: String(selectedTable.table_number),
        booking_start_time: bookingPayload.booking_start_time,
        booking_end_time: bookingPayload.booking_end_time,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer: customerId,
        chair_count: chairCount,
        chair_numbers: chairs,
      };
      setBookings((prev) => [...prev, optimisticBooking]);

      let bookingSuccess = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        const response = await fetch(
          "/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.book_table",
          {
            method: "POST",
            headers: {
              Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(bookingPayload),
          }
        );
        if (!response.ok) {
          if (attempt === 3)
            throw new Error(
              `Failed to book table after ${attempt} attempts: ${response.status}`
            );
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
        const bookingData = await response.json();
        const result = bookingData.message || bookingData;
        if (result.status === "success") {
          bookingSuccess = true;
          break;
        }
        if (attempt === 3)
          throw new Error(
            `Failed to book table: ${result.message || "Unknown error"}`
          );
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (!bookingSuccess)
        throw new Error("Failed to book table after all retries.");

      alert(
        `Table ${selectedTable.table_number} booked successfully for chairs ${chairs.join(
          ", "
        )}!`
      );
      setShowBookingModal(false);
      setBookingDetails({
        startTime: "",
        endTime: "",
        customer: "",
        chairs: [],
        isNewCustomer: false,
        newCustomer: {
          customer_name: "",
          mobile_no: "",
          primary_address: "",
          email_id: "",
          custom_watsapp_no: "",
        },
      });
      await fetchBookings();
    } catch (error) {
      console.error("Error booking table:", error);
      setBookings((prev) =>
        prev.filter(
          (b) =>
            b.table_number !== String(selectedTable.table_number) ||
            b.booking_start_time !==
              bookingDetails.startTime.replace("T", " ") + ":00"
        )
      );
      alert(`Failed to book table: ${error.message}`);
    }
  };

  // Helper function to render chairs in a circular layout
  const renderChairs = (table, isModal = false, toggleFunction = null, selectedChairs = []) => {
    const totalChairs = table.number_of_chair || table.totalChairs;
    const chairs = [];
    const radius = 60; // Radius for chair positioning
    const bookedChairNumbers = isModal
      ? getBookedChairNumbers(table.table_number)
      : getBookedChairNumbers(table.table_number);
    for (let i = 0; i < totalChairs; i++) {
      const chairNumber = i + 1;
      const angle = (360 / totalChairs) * i;
      const x = radius * Math.cos((angle * Math.PI) / 180);
      const y = radius * Math.sin((angle * Math.PI) / 180);
      const style = {
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: "translate(-50%, -50%)",
      };
      const isBooked = bookedChairNumbers.includes(chairNumber);
      const isAvailable = availableChairsList.includes(chairNumber);
      const isSelected = selectedChairs.includes(chairNumber);
      const status = isModal && toggleFunction ? (isBooked ? "booked" : isAvailable ? "available" : "booked") : (isBooked ? "booked" : "available");
      chairs.push(
        <div
          key={chairNumber}
          className={`chair-wrapper ${status}-chair-wrapper ${
            isSelected && isModal ? "selected-chair-wrapper" : ""
          }`}
          style={style}
          onClick={
            isModal && toggleFunction && isAvailable
              ? () => toggleFunction(chairNumber)
              : null
          }
        >
          <i
            className={`fa-solid fa-chair chair-icon ${status}-chair ${
              isSelected && isModal ? "selected-chair" : ""
            }`}
          ></i>
          <span className="chair-number">{chairNumber}</span>
        </div>
      );
    }
    return chairs;
  };

  if (loading) return <div className="text-center mt-5">Loading tables...</div>;
  if (error)
    return <div className="text-center mt-5 text-danger">Error: {error}</div>;

  return (
    <ErrorBoundary>
      <div className="d-flex flex-column min-vh-100 bg-light">
        {/* Header */}
        <header className="p-3 bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <i
              className="fas fa-arrow-left back-arrow"
              onClick={() => navigate("/firsttab")}
            ></i>
          </div>
        </header>

        {/* Main Content */}
        <main
          className="flex-grow-1 py-4 position-relative"
          style={{
            background:
              "linear-gradient(135deg, #ffffff 0%, #3498db 100%)",
          }}
        >
          <div className="container">
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
              {tables.length > 0 ? (
                tables.map((table) => {
                  const bookedChairsCount = getBookedChairs(table.table_number);
                  const availableChairs =
                    table.number_of_chair - bookedChairsCount;
                  const bookedChairNumbers = getBookedChairNumbers(
                    table.table_number
                  );
                  const bookingInfo = getBookingDetails(table.table_number);
                  const preBooked = isTablePreBooked(
                    table.table_number,
                    table.number_of_chair
                  );
                  const statusClass = preBooked
                    ? "pre-booked"
                    : bookedChairsCount > 0
                    ? availableChairs > 0
                      ? "partially-booked"
                      : "booked"
                    : "available";
                  return (
                    <div
                      key={table.table_number}
                      className="col"
                      style={{ width: "20%" }}
                    >
                      <div className={`card shadow-sm border-0 p-3 ${statusClass}`}>
                        <div className="text-center">
                          <div
                            className="table-container position-relative d-inline-block"
                            style={{
                              width: "150px",
                              height: "150px",
                              padding: "15px",
                            }}
                          >
                            <div
                              className="table-shape position-absolute top-50 start-50 translate-middle"
                              style={{
                                width: "80px",
                                height: "80px",
                                backgroundColor: "#8B4513",
                                borderRadius: "50%",
                                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                              }}
                            ></div>
                            {renderChairs(table)}
                          </div>
                          <div className="mt-2">
                            <h5 className="fw-bold">Table {table.table_number}</h5>
                            <p className="chair-status small">
                              {availableChairs} of {table.number_of_chair} chairs
                              available
                            </p>
                            {bookingInfo.length > 0 && (
                              <div className="booking-status text-muted small">
                                {bookingInfo.map((booking, idx) => (
                                  <div key={idx}>
                                    <p className="mb-1">
                                      Pre-booked:{" "}
                                      {new Date(
                                        booking.booking_start_time
                                      ).toLocaleString()}{" "}
                                      to{" "}
                                      {new Date(
                                        booking.booking_end_time
                                      ).toLocaleString()}
                                    </p>
                                    <p className="mb-1">
                                      By: {booking.customer_name} (
                                      {booking.customer_phone})
                                    </p>
                                    <p className="mb-0">
                                      Chairs: {booking.chair_numbers.join(", ")}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="table-actions mt-2">
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleTableClick(table)}
                              >
                                Select Table
                              </button>
                              <button
                                className="btn btn-info btn-sm"
                                onClick={() => handleViewBookings(table)}
                              >
                                View Bookings
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
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center">
                  No tables available. Check server logs or ensure tables are set
                  up in the backend.
                </div>
              )}
            </div>
          </div>

          {/* Color Legend */}
          <div className="position-fixed bottom-0 start-0 p-3">
            <div className="card shadow-sm p-2">
              <h6 className="fw-bold mb-2">Chair Status</h6>
              <div className="d-flex align-items-center mb-1">
                <div className="color-box booked me-2"></div>
                <span className="small">Booked</span>
              </div>
              <div className="d-flex align-items-center mb-1">
                <div className="color-box reserved me-2"></div>
                <span className="small">Reserved</span>
              </div>
              <div className="d-flex align-items-center">
                <div className="color-box available me-2"></div>
                <span className="small">Available</span>
              </div>
            </div>
          </div>
        </main>

        {/* Chair Selection Modal */}
        {showChairModal && selectedTable && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Select Chairs for Table {selectedTable.table_number}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowChairModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>
                    Total Chairs: {totalChairs}, Available Chairs:{" "}
                    {availableChairsList.length}
                  </p>
                  <div
                    className="table-container position-relative"
                    style={{ width: "200px", height: "200px", margin: "0 auto" }}
                  >
                    <div
                      className="table-shape position-absolute top-50 start-50 translate-middle"
                      style={{
                        width: "80px",
                        height: "80px",
                        backgroundColor: "#8B4513",
                        borderRadius: "50%",
                      }}
                    ></div>
                    {renderChairs(
                      selectedTable,
                      true,
                      toggleChair,
                      selectedChairs
                    )}
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
                    disabled={selectedChairs.length === 0}
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
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Book Table {selectedTable.table_number}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowBookingModal(false)}
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
                      name="startTime"
                      value={bookingDetails.startTime}
                      onChange={handleBookingChange}
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
                      name="endTime"
                      value={bookingDetails.endTime}
                      onChange={handleBookingChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Chair Selection:</label>
                    <p>
                      Total Chairs: {totalChairs}, Available Chairs:{" "}
                      {availableChairsList.length}
                    </p>
                    <div
                      className="table-container position-relative"
                      style={{ width: "200px", height: "200px", margin: "0 auto" }}
                    >
                      <div
                        className="table-shape position-absolute top-50 start-50 translate-middle"
                        style={{
                          width: "80px",
                          height: "80px",
                          backgroundColor: "#8B4513",
                          borderRadius: "50%",
                        }}
                      ></div>
                      {renderChairs(
                        selectedTable,
                        true,
                        toggleBookingChair,
                        bookingDetails.chairs
                      )}
                    </div>
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
                          setBookingDetails({
                            ...bookingDetails,
                            isNewCustomer: false,
                          })
                        }
                      />
                      <label
                        className="form-check-label"
                        htmlFor="existingCustomer"
                      >
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
                          setBookingDetails({
                            ...bookingDetails,
                            isNewCustomer: true,
                          })
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
                        name="customer"
                        value={bookingDetails.customer}
                        onChange={handleBookingChange}
                        required
                      >
                        <option value="">Select a customer</option>
                        {customers.map((customer) => (
                          <option key={customer.name} value={customer.name}>
                            {customer.customer_name} (
                            {customer.mobile_no || "No phone"})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <label
                          htmlFor="newCustomerName"
                          className="form-label"
                        >
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
                        <label
                          htmlFor="newCustomerPhone"
                          className="form-label"
                        >
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
                        <label
                          htmlFor="newCustomerAddress"
                          className="form-label"
                        >
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
                        <label
                          htmlFor="newCustomerEmail"
                          className="form-label"
                        >
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
                        <label
                          htmlFor="newCustomerWhatsApp"
                          className="form-label"
                        >
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
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Verify Customer for Table {selectedTable.table_number}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowVerificationModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Please select the customer to verify the booking.</p>
                  <div className="mb-3">
                    <label
                      htmlFor="verificationCustomer"
                      className="form-label"
                    >
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
                          {customer.customer_name} (
                          {customer.mobile_no || "No phone"})
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

        {/* Bookings Modal */}
        {showBookingsModal && selectedTable && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Active Bookings for Table {selectedTable.table_number}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowBookingsModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {getBookingDetails(selectedTable.table_number).length > 0 ? (
                    <ul className="list-group">
                      {getBookingDetails(selectedTable.table_number).map(
                        (booking, idx) => (
                          <li
                            key={idx}
                            className="list-group-item list-group-item-action"
                            onClick={() => handleBookingSelection(booking)}
                            style={{ cursor: "pointer" }}
                          >
                            <strong>Customer:</strong> {booking.customer_name} (
                            {booking.customer_phone})<br />
                            <strong>Time:</strong>{" "}
                            {new Date(
                              booking.booking_start_time
                            ).toLocaleString()}{" "}
                            to{" "}
                            {new Date(
                              booking.booking_end_time
                            ).toLocaleString()}
                            <br />
                            <strong>Chairs:</strong>{" "}
                            {booking.chair_numbers.join(", ")}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>No active bookings found.</p>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowBookingsModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default Table;