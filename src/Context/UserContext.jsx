import React, { createContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

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
            return sum + ((basePrice + customVariantPrice) * (item.quantity || 1)) + addonsPrice + combosPrice;
        }, 0);
        setTotalPrice(newTotalPrice);
    }, [cartItems]);

    const areItemsEqual = (item1, item2) => {
        if (item1.cartItemId !== item2.cartItemId) return false;
        if (item1.item_code !== item2.item_code) return false;
        if (item1.selectedSize !== item2.selectedSize) return false;
        if (item1.selectedCustomVariant !== item2.selectedCustomVariant) return false;
        if (item1.custom_customer_description !== item2.custom_customer_description) return false;
        const addonCounts1 = item1.addonCounts || {};
        const addonCounts2 = item2.addonCounts || {};
        const addonKeys1 = Object.keys(addonCounts1);
        const addonKeys2 = Object.keys(addonCounts2);
        if (addonKeys1.length !== addonKeys2.length) return false;
        for (const key of addonKeys1) {
            if (!addonCounts2[key] || addonCounts1[key].quantity !== addonCounts2[key].quantity) return false;
        }
        const combos1 = item1.selectedCombos || [];
        const combos2 = item2.selectedCombos || [];
        if (combos1.length !== combos2.length) return false;
        for (let i = 0; i < combos1.length; i++) {
            if (
                combos1[i].name1 !== combos2[i].name1 ||
                combos1[i].selectedSize !== combos2[i].selectedSize ||
                combos1[i].selectedCustomVariant !== combos2[i].selectedCustomVariant ||
                combos1[i].quantity !== combos2[i].quantity
            ) {
                return false;
            }
        }
        return true;
    };

    const addToCart = (item) => {
        console.log('UserContext.jsx: addToCart called with:', JSON.stringify(item, null, 2));
        console.log('UserContext.jsx: Current cartItems before adding:', JSON.stringify(cartItems, null, 2));

        setCartItems((prevItems) => {
            const itemQuantity = item.quantity || 1;
            const newItem = {
                ...item,
                cartItemId: item.cartItemId || uuidv4(),
                quantity: itemQuantity,
            };

            const existingItemIndex = prevItems.findIndex((cartItem) => areItemsEqual(cartItem, newItem));

            if (existingItemIndex !== -1) {
                const updatedItems = [...prevItems];
                updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    quantity: updatedItems[existingItemIndex].quantity + itemQuantity,
                };
                console.log('UserContext.jsx: Cart after updating quantity:', JSON.stringify(updatedItems, null, 2));
                return updatedItems;
            } else {
                const updatedItems = [...prevItems, newItem];
                console.log('UserContext.jsx: Cart after adding new item:', JSON.stringify(updatedItems, null, 2));
                return updatedItems;
            }
        });
    };

    const removeFromCart = (item) => {
        console.log("removeFromCart called for:", JSON.stringify({ item_code: item.item_code, cartItemId: item.cartItemId }, null, 2));
        setCartItems((prevItems) => prevItems.filter((cartItem) => cartItem.cartItemId !== item.cartItemId));
    };

    const setItemDetails = (item) => {
        setSelectedItemDetails(item);
    };

    const updateCartItem = (updatedItem) => {
        setCartItems((prevItems) =>
            prevItems.map((cartItem) =>
                cartItem.cartItemId === updatedItem.cartItemId ? { ...cartItem, ...updatedItem } : cartItem
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