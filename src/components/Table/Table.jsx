import React, { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./table.css";
import UserContext from "../../Context/UserContext";
import { v4 as uuidv4 } from "uuid";

function Table() {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { setCartItems } = useContext(UserContext);
    const [activeOrders, setActiveOrders] = useState([]); // [{ tableNumber, bookedChairs }]
    const [allItems, setAllItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [chairCount, setChairCount] = useState(1);
    const [availableChairs, setAvailableChairs] = useState(0);
    const navigate = useNavigate();

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

    useEffect(() => {
        const fetchTablesAndOrders = async () => {
            try {
                const tableResponse = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_table_details", {
                    headers: { Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a" },
                });
                if (!tableResponse.ok) throw new Error(`HTTP error! Status: ${tableResponse.status}`);
                const tableData = await tableResponse.json();
                console.log("Fetched Tables:", JSON.stringify(tableData, null, 2));
                setTables(tableData.message || []);

                await fetchAllItems();
                await fetchActiveOrders();
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchTablesAndOrders();
    }, [fetchActiveOrders]);

    const getBookedChairs = (tableNumber) => {
        const order = activeOrders.find((o) => o.tableNumber === String(tableNumber));
        return order ? order.bookedChairs : 0;
    };

    const handleTableClick = (table) => {
        const bookedChairs = getBookedChairs(table.table_number);
        const available = table.number_of_chair - bookedChairs;
        if (available <= 0) {
            alert("No chairs available for this table.");
            return;
        }
        setSelectedTable(table);
        setAvailableChairs(available);
        setChairCount(1);
        setShowModal(true);
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

            // Always create a new order for new chair selections
            setShowModal(false);
            setCartItems([]);
            console.log(
                "Creating new POS Invoice for Table",
                selectedTable.table_number,
                "with chairCount",
                chairCount
            );
            navigate("/frontpage", {
                state: {
                    tableNumber: selectedTable.table_number,
                    chairCount,
                    deliveryType: "DINE IN",
                },
            });
        } catch (error) {
            console.error("Error fetching POS Invoice for table:", error);
            setCartItems([]);
            setShowModal(false);
            navigate("/frontpage", {
                state: {
                    tableNumber: selectedTable.table_number,
                    chairCount,
                    deliveryType: "DINE IN",
                },
            });
        }
    };

    if (loading) return <div>Loading tables...</div>;
    if (error) return <div>Error: {error}</div>;

    console.log("Rendering tables with activeOrders:", activeOrders);

    return (
        <>
            <div className="table-page container">
                <i className="fi fi-rs-angle-small-left back-button1" onClick={() => navigate("/firsttab")}></i>
                <div className="table-grid">
                    {tables.length > 0 ? (
                        tables.map((table, index) => {
                            const bookedChairs = getBookedChairs(table.table_number);
                            const availableChairs = table.number_of_chair - bookedChairs;
                            return (
                                <div
                                    key={index}
                                    className={`table-card ${
                                        bookedChairs > 0
                                            ? availableChairs > 0
                                                ? "partially-booked"
                                                : "booked"
                                            : "available"
                                    }`}
                                    onClick={() => handleTableClick(table)}
                                >
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
                                </div>
                            );
                        })
                    ) : (
                        <div>No tables available.</div>
                    )}
                </div>
            </div>

            {/* Chair Selection Modal */}
            {showModal && selectedTable && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Select Chairs for Table {selectedTable.table_number}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                    aria-label="Close"
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>
                                    Available chairs: {availableChairs} out of {selectedTable.number_of_chair}
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
                                    onClick={() => setShowModal(false)}
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
        </>
    );
}

export default Table;