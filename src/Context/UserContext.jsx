import React, { createContext, useEffect, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [selectedItemDetails, setSelectedItemDetails] = useState(null);
    const [totalPrice, setTotalPrice] = useState(0);
    const [preparedItems, setPreparedItems] = useState([]);
    const [kitchenOrders, setKitchenOrders] = useState([]);
    const [bearerOrders, setBearerOrders] = useState([]);

    useEffect(() => {
        const newTotalPrice = cartItems.reduce((sum, item) => {
            const basePrice = item.basePrice || 0;
            const customVariantPrice = item.customVariantPrice || 0;
            const addonsPrice = Object.entries(item.addonCounts || {}).reduce(
                (addonSum, [_, { price, quantity }]) => addonSum + (price * quantity),
                0
            );
            const combosPrice = (item.selectedCombos || []).reduce((comboSum, combo) => {
                const comboBasePrice = combo.rate || 0;
                const comboQuantity = combo.quantity || 1;
                return comboSum + comboBasePrice * comboQuantity;
            }, 0);
            return sum + ((basePrice + customVariantPrice) * item.quantity) + addonsPrice + combosPrice;
        }, 0);
        setTotalPrice(newTotalPrice);
    }, [cartItems]);

    const addToCart = (newItem) => {
        setCartItems((prevItems) => {
            const existingItemIndex = prevItems.findIndex((cartItem) => cartItem.id === newItem.id);
            if (existingItemIndex !== -1) {
                const existingItem = prevItems[existingItemIndex];
                const combosMatch = JSON.stringify(
                    (existingItem.selectedCombos || []).map(c => ({
                        name1: c.name1,
                        selectedSize: c.selectedSize,
                        selectedCustomVariant: c.selectedCustomVariant,
                        quantity: c.quantity
                    }))
                ) === JSON.stringify(
                    (newItem.selectedCombos || []).map(c => ({
                        name1: c.name1,
                        selectedSize: c.selectedSize,
                        selectedCustomVariant: c.selectedCustomVariant,
                        quantity: c.quantity
                    }))
                );

                if (
                    existingItem.selectedCustomVariant === newItem.selectedCustomVariant &&
                    existingItem.selectedSize === newItem.selectedSize &&
                    combosMatch
                ) {
                    const mergedAddonCounts = { ...existingItem.addonCounts };
                    Object.entries(newItem.addonCounts || {}).forEach(([addonName, { price, quantity }]) => {
                        if (mergedAddonCounts[addonName]) {
                            mergedAddonCounts[addonName].quantity += quantity;
                        } else {
                            mergedAddonCounts[addonName] = { price, quantity };
                        }
                    });

                    const mergedCombos = [...(existingItem.selectedCombos || [])];
                    (newItem.selectedCombos || []).forEach((newCombo) => {
                        const comboMatchIndex = mergedCombos.findIndex(
                            (combo) =>
                                combo.name1 === newCombo.name1 &&
                                combo.selectedSize === newCombo.selectedSize &&
                                combo.selectedCustomVariant === newCombo.selectedCustomVariant
                        );
                        if (comboMatchIndex !== -1) {
                            mergedCombos[comboMatchIndex].quantity =
                                (mergedCombos[comboMatchIndex].quantity || 1) + (newCombo.quantity || 1);
                        } else {
                            mergedCombos.push({ ...newCombo });
                        }
                    });

                    return prevItems.map((cartItem, index) =>
                        index === existingItemIndex
                            ? {
                                  ...cartItem,
                                  quantity: cartItem.quantity + newItem.quantity,
                                  addonCounts: mergedAddonCounts,
                                  selectedCombos: mergedCombos,
                              }
                            : cartItem
                    );
                }
            }
            return [...prevItems, newItem];
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
                item.id === updatedItem.id ? updatedItem : item
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
        setKitchenOrders((prevOrders) =>
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

    const addKitchenOrder = async (order) => {
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

        // Prepare and send each kitchen order to the backend
        const kitchenOrderPromises = Object.entries(kitchenOrders).map(async ([kitchen, kitchenOrder]) => {
            const orderData = {
                customer_name: kitchenOrder.customerName || "Unknown",
                table_number: kitchenOrder.tableNumber || "",
                phone_number: kitchenOrder.phoneNumber || "",
                time: new Date().toISOString(),
                delivery_type: kitchenOrder.deliveryType || "DINE IN",
                items: kitchenOrder.cartItems.map(item => ({
                    item: item.item_code || item.name,
                    quantity: item.quantity || 1,
                    price: item.basePrice || 0,
                    size_variants: item.selectedSize || "",
                    other_variants: item.selectedCustomVariant || "",
                    kitchen: item.kitchen || "Unknown",
                })),
                saved_addons: kitchenOrder.cartItems.flatMap(item =>
                    Object.entries(item.addonCounts || {}).map(([addonName, { price, quantity, kitchen }]) => ({
                        addon_name: addonName,
                        addon_quantity: quantity,
                        addons_kitchen: kitchen || "Unknown",
                    }))
                ),
                saved_combos: kitchenOrder.cartItems.flatMap(item =>
                    (item.selectedCombos || []).map(combo => ({
                        combo_name: combo.name1,
                        size_variants: combo.selectedSize || "",
                        quantity: combo.quantity || 1,
                        other_variants: combo.selectedCustomVariant || "",
                        combo_kitchen: combo.kitchen || "Unknown",
                    }))
                ),
            };

            try {
                const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.manage_saved_orders?method=POST", {
                    method: "POST",
                    headers: {
                        "Authorization": "token 0bde704e8493354:5709b3ab1a1cb1a",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(orderData),
                });
                if (!response.ok) throw new Error("Failed to save kitchen order");
                const result = await response.json();
                if (result.status !== "success") throw new Error(result.message || "Unknown error");
                console.log(`Kitchen order for ${kitchen} saved:`, result);
                return kitchenOrder;
            } catch (error) {
                console.error(`Error saving kitchen order for ${kitchen}:`, error);
                throw error;
            }
        });

        try {
            const savedKitchenOrders = await Promise.all(kitchenOrderPromises);
            setKitchenOrders(savedKitchenOrders);
            alert("Order successfully sent to the kitchen!");
        } catch (error) {
            alert("Failed to send some kitchen orders. Please try again.");
        }
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
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;