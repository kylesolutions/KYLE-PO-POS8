// import React, { useContext, useState, useEffect } from "react";
// import UserContext from "../../Context/UserContext";
// import { useNavigate } from "react-router-dom";

// function Kitchen() {
//     const { savedOrders, updateOrderStatus, informBearer, preparedItems } = useContext(UserContext);
//     const navigate = useNavigate();
//     const [selectedKitchen, setSelectedKitchen] = useState(null);

//     // Extract unique kitchen types
//     const kitchens = [...new Set(savedOrders.flatMap(order =>
//         order.cartItems.map(item => item.kitchen).filter(kitchen => kitchen)
//     ))];

//     // Set default selected kitchen when kitchens change
//     useEffect(() => {
//         if (kitchens.length > 0 && !selectedKitchen) {
//             setSelectedKitchen(kitchens[0]); // Select first kitchen by default
//         }
//     }, [kitchens, selectedKitchen]);

//     // Ensure filtering applies when kitchen changes
//     const filteredOrders = savedOrders
//         .map(order => ({
//             ...order,
//             cartItems: order.cartItems.filter(
//                 item => item.kitchen === selectedKitchen && item.category !== "Drinks" && item.status !== "PickedUp"
//             ),
//         }))
//         .filter(order => order.cartItems.length > 0); // Remove empty orders

//     const handleStatusChange = (id, newStatus) => {
//         updateOrderStatus(id, newStatus);
//     };

//     const handleInformBearer = () => {
//         const preparedOrders = savedOrders
//             .map(order => ({
//                 ...order,
//                 cartItems: order.cartItems.filter(
//                     item => preparedItems.includes(item.id) && item.category !== "Drinks" && item.kitchen === selectedKitchen
//                 ),
//             }))
//             .filter(order => order.cartItems.length > 0); // Remove empty orders
    
//         if (preparedOrders.length === 0) {
//             console.warn("No prepared items to inform the bearer about.");
//             return;
//         }
    
//         // Create customer & table mapping
//         const customerTableData = preparedOrders.map(order => ({
//             customerName: order.customerName || "Unknown Customer",
//             tableNumber: order.tableNumber || "Unknown Table",
//         }));
    
//         // Flatten prepared items to send them separately
//         const preparedItemsData = preparedOrders.flatMap(order =>
//             order.cartItems.map(item => ({
//                 id: item.id,
//                 name: item.name,
//                 selectedSize: item.selectedSize || "N/A",
//                 customerName: order.customerName || "Unknown",
//                 tableNumber: order.tableNumber || "Unknown",
//                 isPickedUp: false, // Initialize as not picked up
//             }))
//         );
    
//         // Inform bearer for each item
//         preparedItemsData.forEach(item => informBearer(item));
    
//         alert("Items have been marked as Prepared. The bearer has been informed!");
    
//         navigate("/bearer", {
//             state: { customerTableData, preparedOrders: preparedItemsData }, 
//         });
//     };
    

//     return (
//         <div className="container mt-4">
//             <h3 className="text-center">Kitchen Note</h3>

//             {/* Kitchen Tabs */}
//             <div className="d-flex mb-3 gap-3">
//                 {kitchens.map(kitchen => (
//                     <button
//                         key={kitchen}
//                         className={`btn btn-sm ${selectedKitchen === kitchen ? "btn-primary" : "btn-outline-primary"}`}
//                         onClick={() => setSelectedKitchen(kitchen)}
//                     >
//                         {kitchen}
//                     </button>
//                 ))}
//             </div>

//             <h5>Current Orders - {selectedKitchen}</h5>
//             {filteredOrders.length === 0 ? (
//                 <p>No orders for this kitchen.</p>
//             ) : (
//                 <div className="table-responsive">
//                     <table className="table table-bordered">
//                         <thead>
//                             <tr>
//                                 <th>Customer</th>
//                                 <th>Table</th>
//                                 <th>Item</th>
//                                 <th>Image</th>
//                                 <th>Quantity</th>
//                                 <th>Category</th>
//                                 <th>Status</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {filteredOrders.map((order, orderIndex) =>
//                                 order.cartItems.map((item, itemIndex) => (
//                                     <tr key={`${orderIndex}-${itemIndex}`}>
//                                         {itemIndex === 0 && (
//                                             <>
//                                                 <td rowSpan={order.cartItems.length}>{order.customerName || "Unknown"}</td>
//                                                 <td rowSpan={order.cartItems.length}>{order.tableNumber || "N/A"}</td>
//                                             </>
//                                         )}
//                                         <td>{item.name}</td>
//                                         <td>
//                                             <img src={item.image} className="rounded"
//                                                 style={{
//                                                     width: "70px",
//                                                     height: "50px",
//                                                     objectFit: "cover",
//                                                     border: "1px solid #ddd",
//                                                 }} 
//                                             />
//                                         </td>
//                                         <td>{item.quantity}</td>
//                                         <td>{item.category}</td>
//                                         <td>
//                                             <select
//                                                 value={item.status || "Pending"}
//                                                 onChange={(e) => handleStatusChange(item.id, e.target.value)}
//                                                 className="form-select"
//                                             >
//                                                 <option value="Pending">Pending</option>
//                                                 <option value="Preparing">Preparing</option>
//                                                 <option value="Prepared">Prepared</option>
//                                             </select>
//                                         </td>
//                                     </tr>
//                                 ))
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             )}

//             {preparedItems.length > 0 && (
//                 <div className="text-center mt-4">
//                     <button className="btn btn-primary" onClick={handleInformBearer}>
//                         Inform Bearer
//                     </button>
//                 </div>
//             )}
//         </div>
//     );
// }

// export default Kitchen;


import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Kitchen() {
    const navigate = useNavigate();
    const [savedOrders, setSavedOrders] = useState([]);
    const [preparedItems, setPreparedItems] = useState([]);
    const [selectedKitchen, setSelectedKitchen] = useState(null);
    const [showBearerInfo, setShowBearerInfo] = useState(false);
    const [preparedOrdersData, setPreparedOrdersData] = useState([]);
    const [showStatusPopup, setShowStatusPopup] = useState(false);
    const [pickedUpItems, setPickedUpItems] = useState([]);

    // Load data from localStorage on mount
    useEffect(() => {
        const storedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
        const storedPreparedItems = JSON.parse(localStorage.getItem("preparedItems")) || [];
        const storedPickedUpItems = JSON.parse(localStorage.getItem("pickedUpItems")) || [];
        setSavedOrders(storedOrders);
        setPreparedItems(storedPreparedItems);
        setPickedUpItems(storedPickedUpItems);
    }, []);

    // Extract unique kitchen types
    const kitchens = [
        ...new Set(
            savedOrders.flatMap((order) =>
                order.cartItems.map((item) => item.kitchen).filter((kitchen) => kitchen)
            )
        ),
    ];

    // Set default selected kitchen
    useEffect(() => {
        if (kitchens.length > 0 && !selectedKitchen) {
            setSelectedKitchen(kitchens[0]);
        }
    }, [kitchens, selectedKitchen]);

    // Filter orders based on selected kitchen
    const filteredOrders = savedOrders
        .map((order) => ({
            ...order,
            cartItems: order.cartItems.filter(
                (item) =>
                    item.kitchen === selectedKitchen &&
                    item.category !== "Drinks" &&
                    item.status !== "PickedUp"
            ),
        }))
        .filter((order) => order.cartItems.length > 0);

    // Handle status change
    const handleStatusChange = (id, newStatus) => {
        const updatedOrders = savedOrders.map((order) => ({
            ...order,
            cartItems: order.cartItems.map((item) =>
                item.id === id ? { ...item, status: newStatus } : item
            ),
        }));

        if (newStatus === "Prepared") {
            setPreparedItems((prev) => [...new Set([...prev, id])]);
        } else if (newStatus !== "Prepared") {
            setPreparedItems((prev) => prev.filter((itemId) => itemId !== id));
        }

        setSavedOrders(updatedOrders);
        localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
        localStorage.setItem("preparedItems", JSON.stringify(preparedItems));
    };

    // Handle informing bearer
    const handleInformBearer = () => {
        const preparedOrders = savedOrders
            .map((order) => ({
                ...order,
                cartItems: order.cartItems.filter(
                    (item) =>
                        preparedItems.includes(item.id) &&
                        item.category !== "Drinks" &&
                        item.kitchen === selectedKitchen
                ),
            }))
            .filter((order) => order.cartItems.length > 0);

        if (preparedOrders.length === 0) {
            alert("No prepared items to show.");
            return;
        }

        const preparedItemsData = preparedOrders.flatMap((order) =>
            order.cartItems.map((item) => ({
                id: item.id,
                name: item.name,
                selectedSize: item.selectedSize || "N/A",
                customerName: order.customerName || "Unknown",
                tableNumber: order.tableNumber || "Unknown",
                quantity: item.quantity,
                category: item.category,
                isPickedUp: false,
            }))
        );

        setPreparedOrdersData(preparedItemsData);
        setShowBearerInfo(true);
        alert("Items have been marked as Prepared. Showing bearer information!");
    };

    // Handle marking item as picked up
    const handlePickUp = (id) => {
        const pickupTime = new Date().toLocaleString();
        
        setPreparedOrdersData(prevOrders =>
            prevOrders.map(item =>
                item.id === id ? { ...item, isPickedUp: true } : item
            )
        );

        // Update savedOrders
        const updatedOrders = savedOrders.map((order) => ({
            ...order,
            cartItems: order.cartItems.map((item) =>
                item.id === id ? { ...item, status: "PickedUp" } : item
            ),
        }));

        // Add to pickedUpItems with timestamp
        const pickedItem = preparedOrdersData.find(item => item.id === id);
        if (pickedItem) {
            const newPickedUpItem = {
                ...pickedItem,
                pickupTime: pickupTime,
                kitchen: selectedKitchen
            };
            setPickedUpItems(prev => {
                const newItems = [...prev, newPickedUpItem];
                localStorage.setItem("pickedUpItems", JSON.stringify(newItems));
                return newItems;
            });
        }

        setSavedOrders(updatedOrders);
        localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
    };

    // Get row background color
    const getRowStyle = (status) => {
        switch (status || "Pending") {
            case "Pending":
                return { backgroundColor: "#f8d7da" };
            case "Preparing":
                return { backgroundColor: "#fff3cd" };
            case "Prepared":
                return { backgroundColor: "#d4edda" };
            default:
                return {};
        }
    };

    // Handle back navigation
    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <button 
                    className="btn btn-secondary" 
                    onClick={handleBack}
                    style={{ marginRight: 'auto' }}
                >
                    Back
                </button>
                <h3 className="text-center" style={{ flex: '1' }}>
                    Kitchen Note
                </h3>
                <button 
                    className="btn btn-info"
                    onClick={() => setShowStatusPopup(true)}
                >
                    Status
                </button>
            </div>

            {/* Kitchen Tabs */}
            <div className="d-flex mb-3 gap-3">
                {kitchens.map((kitchen) => (
                    <button
                        key={kitchen}
                        className={`btn btn-sm ${
                            selectedKitchen === kitchen ? "btn-primary" : "btn-outline-primary"
                        }`}
                        onClick={() => {
                            setSelectedKitchen(kitchen);
                            setShowBearerInfo(false);
                        }}
                    >
                        {kitchen}
                    </button>
                ))}
            </div>

            <h5>Current Orders - {selectedKitchen || "Select a Kitchen"}</h5>
            {filteredOrders.length === 0 ? (
                <p>No orders for this kitchen.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Table</th>
                                <th>Item</th>
                                <th>Image</th>
                                <th>Quantity</th>
                                <th>Category</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order, orderIndex) =>
                                order.cartItems.map((item, itemIndex) => (
                                    <tr
                                        key={`${orderIndex}-${itemIndex}`}
                                        style={getRowStyle(item.status)}
                                    >
                                        {itemIndex === 0 && (
                                            <>
                                                <td rowSpan={order.cartItems.length}>
                                                    {order.customerName || "Unknown"}
                                                </td>
                                                <td rowSpan={order.cartItems.length}>
                                                    {order.tableNumber || "N/A"}
                                                </td>
                                            </>
                                        )}
                                        <td>{item.name}</td>
                                        <td>
                                            <img
                                                src={item.image}
                                                className="rounded"
                                                style={{
                                                    width: "70px",
                                                    height: "50px",
                                                    objectFit: "cover",
                                                    border: "1px solid #ddd",
                                                }}
                                                alt={item.name}
                                            />
                                        </td>
                                        <td>{item.quantity}</td>
                                        <td>{item.category}</td>
                                        <td>
                                            <select
                                                value={item.status || "Pending"}
                                                onChange={(e) =>
                                                    handleStatusChange(item.id, e.target.value)
                                                }
                                                className="form-select"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Preparing">Preparing</option>
                                                <option value="Prepared">Prepared</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {preparedItems.length > 0 && (
                <div className="text-center mt-4">
                    <button className="btn btn-primary" onClick={handleInformBearer}>
                        Inform Bearer
                    </button>
                </div>
            )}

            {/* Bearer Information Section */}
            {showBearerInfo && preparedOrdersData.length > 0 && (
                <div className="mt-5">
                    <h4 className="text-center">Bearer Information</h4>
                    {preparedOrdersData.map((item) => (
                        <div key={item.id} className="card p-3 mb-3">
                            <h6><strong>Item:</strong> {item.name}</h6>
                            <p><strong>Size:</strong> {item.selectedSize}</p>
                            <p><strong>Customer:</strong> {item.customerName}</p>
                            <p><strong>Table Number:</strong> {item.tableNumber}</p>
                            <button
                                className="btn btn-success mt-2"
                                onClick={() => handlePickUp(item.id)}
                                disabled={item.isPickedUp}
                            >
                                {item.isPickedUp ? "Picked Up ✅" : "Mark as Picked Up"}
                            </button>
                        </div>
                    ))}
                    {preparedOrdersData.every(item => item.isPickedUp) && (
                        <div className="text-center mt-4">
                            <button 
                                className="btn btn-primary" 
                                onClick={() => {
                                    setShowBearerInfo(false);
                                    setPreparedItems([]);
                                    localStorage.setItem("preparedItems", JSON.stringify([]));
                                }}
                            >
                                Clear and Continue
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Status Popup */}
            {showStatusPopup && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Picked Up Items Status</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowStatusPopup(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {pickedUpItems.length === 0 ? (
                                    <p>No items have been picked up yet.</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Customer</th>
                                                    <th>Table</th>
                                                    <th>Item</th>
                                                    <th>Quantity</th>
                                                    <th>Category</th>
                                                    <th>Kitchen</th>
                                                    <th>Pickup Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pickedUpItems.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.customerName}</td>
                                                        <td>{item.tableNumber}</td>
                                                        <td>{item.name}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>{item.category}</td>
                                                        <td>{item.kitchen}</td>
                                                        <td>{item.pickupTime}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowStatusPopup(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Kitchen;