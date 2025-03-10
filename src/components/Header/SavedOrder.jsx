import { useContext } from "react";
import UserContext from "../../Context/UserContext";
import { useNavigate } from "react-router-dom";

function SavedOrder({ orders, setSavedOrders }) {
  const { setCartItems } = useContext(UserContext);
  console.log("Received orders:", orders);

  const navigate = useNavigate();

  const handleDeleteOrder = (index) => {
    const confirmed = window.confirm("Are you sure you want to delete this order?");
    if (confirmed) {
      const updatedOrders = orders.filter((_, i) => i !== index);
      setSavedOrders(updatedOrders);
      setCartItems([]); // Reset cart when deleting
      localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
    }
  };

  const handleSelectOrder = (order) => {
    // Format cart items to match FoodDetails structure
    const formattedCartItems = order.cartItems.map(item => ({
      ...item,
      basePrice: item.basePrice || 0,
      quantity: item.quantity || 1, // Main item quantity
      addonCounts: item.addonCounts || {}, // Static add-on quantities with kitchen info
      selectedCombos: item.selectedCombos || [], // Combos with kitchen info
    }));
    setCartItems(formattedCartItems);
    alert(`You selected Table ${order.tableNumber}`);
    navigate("/frontpage", {
      state: {
        tableNumber: order.tableNumber,
        phoneNumber: order.phoneNumber,
        customerName: order.customerName,
        existingOrder: order,
      },
    });
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center">Saved Orders</h2>
      {orders.length === 0 ? (
        <p className="text-center text-muted">No saved orders yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer Name</th>
                <th>Table Number</th>
                <th>Phone Number</th>
                <th>Items</th>
                <th>Timestamp</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{order.customerName}</td>
                  <td>{order.tableNumber}</td>
                  <td>{order.phoneNumber}</td>
                  <td>
                    {order.cartItems.map((item, i) => (
                      <div key={i}>
                        <div>
                          {item.name} - Qty: {item.quantity}
                        </div>
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
                                + {combo.name1} x{combo.quantity || 1} {combo.selectedVariant ? `(${combo.selectedVariant})` : ''} 
                                - ${(combo.combo_price || 0).toFixed(2)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </td>
                  <td>{new Date(order.timestamp).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm me-2"
                      onClick={() => handleSelectOrder(order)}
                    >
                      Select
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteOrder(index)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SavedOrder;