import React, { createContext, useEffect, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [selectedItemDetails, setSelectedItemDetails] = useState(null);
    const [totalPrice, setTotalPrice] = useState(0);
    const [preparedItems, setPreparedItems] = useState([]);
    const [kitchenOrders, setKitchenOrders] = useState([]);
    const [bearerOrders, setBearerOrders] = useState([]);
    const [savedOrders, setSavedOrders] = useState(() => {
        const saved = localStorage.getItem("savedOrders");
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem("savedOrders", JSON.stringify(savedOrders));
    }, [savedOrders]);

    useEffect(() => {
        // Recalculate total price whenever cartItems change
        const newTotalPrice = cartItems.reduce((sum, item) => {
            const basePrice = item.basePrice || 0;
            const addonsPrice = Object.entries(item.addonCounts || {}).reduce(
                (addonSum, [_, { price, quantity }]) => addonSum + (price * quantity),
                0
            );
            const combosPrice = (item.selectedCombos || []).reduce((comboSum, combo) => {
                const comboBasePrice = combo.combo_price || 0;
                const variantPrice = combo.variantPrice || 0;
                return comboSum + comboBasePrice + variantPrice;
            }, 0);
            return sum + (basePrice * item.quantity) + addonsPrice + combosPrice; // Adjusted to not multiply addons/combos by quantity
        }, 0);
        setTotalPrice(newTotalPrice);
    }, [cartItems]);

    const addToCart = (newItem) => {
        setCartItems((prevItems) => {
            const existingItemIndex = prevItems.findIndex((cartItem) => cartItem.id === newItem.id);
            if (existingItemIndex !== -1) {
                const existingItem = prevItems[existingItemIndex];
                // Merge addonCounts
                const mergedAddonCounts = { ...existingItem.addonCounts };
                Object.entries(newItem.addonCounts || {}).forEach(([addonName, { price, quantity }]) => {
                    if (mergedAddonCounts[addonName]) {
                        mergedAddonCounts[addonName].quantity += quantity;
                    } else {
                        mergedAddonCounts[addonName] = { price, quantity };
                    }
                });

                // Merge selectedCombos (stacking approach; adjust if needed)
                const mergedCombos = [...(existingItem.selectedCombos || []), ...(newItem.selectedCombos || [])];

                return prevItems.map((cartItem, index) =>
                    index === existingItemIndex
                        ? {
                              ...cartItem,
                              quantity: cartItem.quantity + newItem.quantity, // Increase main quantity
                              addonCounts: mergedAddonCounts, // Merge add-on quantities
                              selectedCombos: mergedCombos, // Merge combos
                          }
                        : cartItem
                );
            } else {
                return [...prevItems, newItem]; // Add new item as is
            }
        });
    };

    const removeFromCart = (item) => {
        setCartItems((prevItems) => prevItems.filter((cartItem) => cartItem !== item));
    };

    const setItemDetails = (item) => {
        setSelectedItemDetails(item);
    };

    const updateCartItem = (updatedItem) => {
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.id === updatedItem.id ? updatedItem : item // Simplified to match by id only
            )
        );
    };

    const updateAddonQuantity = (itemId, addonName, qtyChange) => {
        setCartItems((prevItems) =>
            prevItems.map((item) => {
                if (item.id === itemId) {
                    const addonData = item.addonCounts[addonName] || { price: 0, quantity: 0 };
                    const newQuantity = Math.max(0, addonData.quantity + qtyChange);
                    const updatedAddonCounts = {
                        ...item.addonCounts,
                        [addonName]: { ...addonData, quantity: newQuantity },
                    };
                    if (newQuantity === 0) {
                        delete updatedAddonCounts[addonName];
                    }
                    return { ...item, addonCounts: updatedAddonCounts };
                }
                return item;
            })
        );
    };

    const updateOrderStatus = (id, status) => {
        setSavedOrders((prevOrders) =>
            prevOrders.map((order) => ({
                ...order,
                cartItems: order.cartItems.map((item) =>
                    item.id === id ? { ...item, status } : item
                ),
            }))
        );
        if (status === "Prepared") {
            setPreparedItems((prev) => (!prev.includes(id) ? [...prev, id] : prev));
        } else {
            setPreparedItems((prev) =>
                prev.filter((preparedItemId) => preparedItemId !== id)
            );
        }
    };

    const markAsPickedUp = (id) => {
        setPreparedItems((prev) => prev.filter((itemId) => itemId !== id));
        setBearerOrders((prev) => prev.filter((item) => item.id !== id));
    };

    const addKitchenOrder = (order) => {
        const filteredCartItems = order.cartItems.filter((item) => item.category !== "Drinks");
        if (filteredCartItems.length === 0) {
            alert("No items to send to the kitchen as all items belong to the 'Drinks' category.");
            return;
        }
        const kitchenOrders = filteredCartItems.reduce((acc, item) => {
            const kitchen = item.kitchen || "Unknown Kitchen";
            if (!acc[kitchen]) acc[kitchen] = { ...order, cartItems: [] };
            acc[kitchen].cartItems.push(item);
            return acc;
        }, {});
        const kitchenOrderArray = Object.values(kitchenOrders);
        setSavedOrders((prevOrders) => {
            const updatedOrders = [...prevOrders, ...kitchenOrderArray];
            localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
            return updatedOrders;
        });
        alert("Order successfully sent to the kitchen!");
    };

    const informBearer = (item) => {
        if (!item || (!item.id && !item.name)) {
            console.error("Invalid item passed to informBearer.");
            return;
        }
        setBearerOrders((prev) => [...prev, { ...item, status: "Prepared" }]);
        setPreparedItems((prev) =>
            prev.filter((preparedItem) => preparedItem.id !== item.id)
        );
    };

    return (
        <UserContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                setItemDetails,
                selectedItemDetails,
                updateCartItem,
                updateAddonQuantity,
                totalPrice,
                setTotalPrice,
                updateOrderStatus,
                setCartItems,
                markAsPickedUp,
                addKitchenOrder,
                preparedItems,
                kitchenOrders,
                bearerOrders,
                informBearer,
                savedOrders,
                setSavedOrders,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;