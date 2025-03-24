import React, { useState, useEffect, useContext } from 'react';
import UserContext from '../../Context/UserContext';
import './foodDetails.css';

const FoodDetails = ({ item, onClose }) => {
    if (!item) return null;

    const { addToCart } = useContext(UserContext);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedCustomVariant, setSelectedCustomVariant] = useState(null);
    const [addonCounts, setAddonCounts] = useState({});
    const [selectedCombo, setSelectedCombo] = useState(null);
    const [comboVariants, setComboVariants] = useState({});
    const [selectedCombos, setSelectedCombos] = useState([]);
    const [showCombos, setShowCombos] = useState(false);
    const [fetchedItem, setFetchedItem] = useState(null);
    const [allItems, setAllItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [mainQuantity, setMainQuantity] = useState(1);
    const [itemTotal, setItemTotal] = useState(0);

    useEffect(() => {
        const fetchItemDetails = async () => {
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
                console.log("Raw API Response:", JSON.stringify(data, null, 2));

                let itemList = Array.isArray(data) ? data : (data.message && Array.isArray(data.message) ? data.message : []);
                if (!itemList.length) throw new Error("Invalid data structure");

                const baseUrl = "http://109.199.100.136:6060/";
                setAllItems(
                    itemList.map((item) => ({
                        ...item,
                        variants: item.variants ? item.variants.map((v) => ({
                            type_of_variants: v.type_of_variants,
                            variant_price: parseFloat(v.variants_price) || 0,
                        })) : [],
                        price_list_rate: parseFloat(item.price_list_rate) || 0,
                        image: item.image ? `${baseUrl}${item.image}` : "default-image.jpg",
                    }))
                );
                const selectedItem = itemList.find((i) => i.item_name === item.name);

                if (selectedItem) {
                    const formattedVariantData = (selectedItem.variants || []).map((v) => ({
                        type_of_variants: v.type_of_variants,
                        variant_price: parseFloat(v.variants_price) || 0,
                    }));
                    setFetchedItem({
                        item_code: selectedItem.item_code,
                        name: selectedItem.item_name,
                        category: selectedItem.item_group,
                        kitchen: selectedItem.custom_kitchen,
                        image: selectedItem.image ? `${baseUrl}${selectedItem.image}` : "default-image.jpg",
                        price: parseFloat(selectedItem.price_list_rate) || 0,
                        addons: selectedItem.addons || [],
                        combos: selectedItem.combos || [],
                        variants: formattedVariantData,
                        ingredients: selectedItem.ingredients || [],
                        calories: selectedItem.custom_total_calories,
                        protein: selectedItem.custom_total_protein,
                        has_variants: selectedItem.has_variants || false,
                    });
                    const hasSizeVariants = itemList.some((i) =>
                        i.item_code.startsWith(selectedItem.item_code.replace(/-[SML]$/, '')) &&
                        ['-S', '-M', '-L'].some((suffix) => i.item_code.endsWith(suffix))
                    );
                    if (hasSizeVariants && !selectedSize) setSelectedSize("M");
                    if (formattedVariantData.length > 0 && !selectedCustomVariant) setSelectedCustomVariant(formattedVariantData[0].type_of_variants);
                }
            } catch (error) {
                console.error("Error fetching item details:", error);
            }
        };
        fetchItemDetails();
    }, [item]);

    useEffect(() => {
        if (!fetchedItem) return;

        const sizePrices = getSizePrices();
        const basePrice = (selectedSize ? sizePrices[selectedSize] : fetchedItem.price) * mainQuantity;
        const customVariantPrice = selectedCustomVariant
            ? (fetchedItem.variants.find((v) => v.type_of_variants === selectedCustomVariant)?.variant_price || 0) * mainQuantity
            : 0;
        const addonsPrice = Object.entries(addonCounts).reduce(
            (sum, [_, { price, quantity }]) => sum + (parseFloat(price) || 0) * quantity,
            0
        );

        const comboPrice = selectedCombos.reduce((sum, combo) => {
            const comboItem = allItems.find((i) => i.item_name === combo.name1);
            const sizePrice = combo.selectedSize && comboItem
                ? (allItems.find((i) => i.item_code === `${comboItem.item_code}-${combo.selectedSize}`)?.price_list_rate || 0)
                : 0;
            const customPrice = combo.selectedCustomVariant && comboItem
                ? (comboItem.variants.find((v) => v.type_of_variants === combo.selectedCustomVariant)?.variant_price || 0)
                : 0;
            const baseComboPrice = parseFloat(combo.combo_price) || 0;
            const comboTotal = (comboItem?.has_variants ? (sizePrice + customPrice) : baseComboPrice) * combo.quantity;
            console.log(`Combo ${combo.name1}: Size=${sizePrice}, Custom=${customPrice}, Base=${baseComboPrice}, Qty=${combo.quantity}, Total=${comboTotal}`);
            return sum + comboTotal;
        }, 0);

        const finalPrice = basePrice + customVariantPrice + addonsPrice + comboPrice;
        console.log("Total Price Breakdown:", { basePrice, customVariantPrice, addonsPrice, comboPrice, finalPrice });
        setItemTotal(finalPrice);
    }, [fetchedItem, selectedSize, selectedCustomVariant, addonCounts, selectedCombos, mainQuantity, allItems]);

    const getSizePrices = () => {
        if (!fetchedItem?.item_code) return { S: 0, M: 0, L: 0 };
        const baseItemCode = fetchedItem.item_code.replace(/-[SML]$/, '');
        const sizePrices = { S: fetchedItem.price, M: fetchedItem.price, L: fetchedItem.price };
        allItems.forEach((sizeItem) => {
            if (sizeItem.item_code === `${baseItemCode}-S`) sizePrices.S = parseFloat(sizeItem.price_list_rate) || sizePrices.S;
            if (sizeItem.item_code === `${baseItemCode}-M`) sizePrices.M = parseFloat(sizeItem.price_list_rate) || sizePrices.M;
            if (sizeItem.item_code === `${baseItemCode}-L`) sizePrices.L = parseFloat(sizeItem.price_list_rate) || sizePrices.L;
        });
        console.log(`Size Prices for ${fetchedItem.name}:`, sizePrices);
        return sizePrices;
    };

    const getComboSizePrices = (comboName) => {
        const comboItem = allItems.find((i) => i.item_name === comboName);
        if (!comboItem?.item_code) return { S: 0, M: 0, L: 0 };
        const baseItemCode = comboItem.item_code.replace(/-[SML]$/, '');
        const sizePrices = { S: comboItem.price_list_rate || 0, M: comboItem.price_list_rate || 0, L: comboItem.price_list_rate || 0 };
        allItems.forEach((sizeItem) => {
            if (sizeItem.item_code === `${baseItemCode}-S`) sizePrices.S = parseFloat(sizeItem.price_list_rate) || sizePrices.S;
            if (sizeItem.item_code === `${baseItemCode}-M`) sizePrices.M = parseFloat(sizeItem.price_list_rate) || sizePrices.M;
            if (sizeItem.item_code === `${baseItemCode}-L`) sizePrices.L = parseFloat(sizeItem.price_list_rate) || sizePrices.L;
        });
        console.log(`Combo Size Prices for ${comboName}:`, sizePrices);
        return sizePrices;
    };

    const getItemCodeForSize = (size) => {
        if (!fetchedItem?.item_code || !size) return fetchedItem.item_code;
        const baseItemCode = fetchedItem.item_code.replace(/-[SML]$/, '');
        const sizeItem = allItems.find((i) => i.item_code === `${baseItemCode}-${size}`);
        return sizeItem ? sizeItem.item_code : fetchedItem.item_code;
    };

    const getItemNameForSize = (size) => {
        if (!fetchedItem?.item_code || !size) return fetchedItem.name;
        const baseItemCode = fetchedItem.item_code.replace(/-[SML]$/, '');
        const sizeItem = allItems.find((i) => i.item_code === `${baseItemCode}-${size}`);
        return sizeItem ? sizeItem.item_name : fetchedItem.name;
    };

    const getComboVariantItemCode = (comboName, size) => {
        const comboItem = allItems.find((i) => i.item_name === comboName);
        if (!comboItem) return comboName;
        if (comboItem.has_variants && size) {
            const variantItem = allItems.find((i) => i.item_code === `${comboItem.item_code}-${size}`);
            return variantItem ? variantItem.item_code : comboItem.item_code;
        }
        return comboItem.item_code;
    };

    const handleSizeChange = (size) => setSelectedSize(size);

    const handleCustomVariantChange = (variant) => setSelectedCustomVariant(variant);

    const toggleAddonSelection = (addon, qtyChange) => {
        setAddonCounts((prev) => {
            const current = prev[addon.name1] || { price: parseFloat(addon.addon_price) || 0, quantity: 0 };
            const newQuantity = Math.max(0, current.quantity + qtyChange);
            return { ...prev, [addon.name1]: { ...current, quantity: newQuantity } };
        });
    };

    const updateComboSelection = (combo, size = null, customVariant = null, remove = false) => {
        const comboItem = allItems.find((i) => i.item_name === combo.name1) || { item_code: combo.name1, has_variants: false };
        const hasVariants = comboItem.has_variants || (comboItem.variants && comboItem.variants.length > 0);

        setSelectedCombos((prev) => {
            const existingIndex = prev.findIndex((c) => c.name1 === combo.name1);
            if (remove || (existingIndex !== -1 && !hasVariants)) {
                return prev.filter((c) => c.name1 !== combo.name1);
            }
            if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], selectedSize: size, selectedCustomVariant: customVariant };
                return updated;
            }
            return [...prev, { ...combo, selectedSize: size, selectedCustomVariant: customVariant, quantity: 1 }];
        });
        setSelectedCombo(null);
    };

    const handleComboClick = (combo) => {
        const comboItem = allItems.find((i) => i.item_name === combo.name1) || { item_code: combo.name1, has_variants: false };
        const hasVariants = comboItem.has_variants || (comboItem.variants && comboItem.variants.length > 0);

        if (hasVariants) {
            setSelectedCombo(combo);
            setComboVariants((prev) => ({
                ...prev,
                [combo.name1]: prev[combo.name1] || { size: 'M', custom: null },
            }));
        } else {
            updateComboSelection(combo, null, null, selectedCombos.some((c) => c.name1 === combo.name1));
        }
    };

    const updateComboQuantity = (comboName, qtyChange) => {
        setSelectedCombos((prev) =>
            prev.map((combo) =>
                combo.name1 === comboName ? { ...combo, quantity: Math.max(1, combo.quantity + qtyChange) } : combo
            )
        );
    };

    const handleAddToCart = () => {
        if (!fetchedItem) return;

        const sizePrices = getSizePrices();
        const selectedItemCode = getItemCodeForSize(selectedSize);
        const selectedItemName = getItemNameForSize(selectedSize);
        const selectedItem = allItems.find((i) => i.item_code === selectedItemCode) || fetchedItem;

        if (fetchedItem.has_variants && !selectedSize) {
            alert("Please select a size for this item.");
            return;
        }

        const customVariantPrice = selectedCustomVariant
            ? (fetchedItem.variants.find((v) => v.type_of_variants === selectedCustomVariant)?.variant_price || 0)
            : 0;

        const customizedItem = {
            cartItemId: `${selectedItemCode}-${Date.now()}`,
            id: selectedItemCode,
            item_code: selectedItemCode,
            name: selectedItemName,
            image: selectedItem.image,
            category: selectedItem.item_group || fetchedItem.category,
            basePrice: selectedSize ? sizePrices[selectedSize] : fetchedItem.price,
            customVariantPrice,
            selectedSize,
            selectedCustomVariant,
            addonCounts: Object.fromEntries(Object.entries(addonCounts).filter(([_, { quantity }]) => quantity > 0)),
            selectedCombos: selectedCombos.map((combo) => {
                const comboItem = allItems.find((i) => i.item_name === combo.name1) || { item_code: combo.name1, has_variants: false };
                const variantItemCode = getComboVariantItemCode(combo.name1, combo.selectedSize);
                const sizePrice = combo.selectedSize && comboItem
                    ? (allItems.find((i) => i.item_code === `${comboItem.item_code}-${combo.selectedSize}`)?.price_list_rate || 0)
                    : 0;
                const customPrice = combo.selectedCustomVariant && comboItem
                    ? (comboItem.variants.find((v) => v.type_of_variants === combo.selectedCustomVariant)?.variant_price || 0)
                    : 0;
                const rate = comboItem.has_variants ? (sizePrice + customPrice) : (parseFloat(combo.combo_price) || 0);
                return {
                    ...combo,
                    item_code: variantItemCode,
                    rate,
                    kitchen: comboItem.custom_kitchen || combo.kitchen || "Unknown",
                };
            }),
            kitchen: selectedItem.custom_kitchen || fetchedItem.kitchen,
            quantity: mainQuantity,
        };

        console.log("Adding to cart:", JSON.stringify(customizedItem, null, 2));
        addToCart(customizedItem);
        onClose();
    };

    const increaseMainQuantity = () => setMainQuantity((prev) => prev + 1);
    const decreaseMainQuantity = () => setMainQuantity((prev) => Math.max(1, prev - 1));

    const getComboPriceDisplay = (combo) => {
        const comboItem = allItems.find((i) => i.item_name === combo.name1) || { has_variants: false };
        const comboData = selectedCombos.find((c) => c.name1 === combo.name1);
        if (comboItem.has_variants && comboData) {
            const sizePrices = getComboSizePrices(combo.name1);
            const sizePrice = comboData.selectedSize ? (sizePrices[comboData.selectedSize] || 0) : 0;
            const customPrice = comboData.selectedCustomVariant
                ? (comboItem.variants.find((v) => v.type_of_variants === comboData.selectedCustomVariant)?.variant_price || 0)
                : 0;
            return (sizePrice + customPrice).toFixed(2);
        }
        return (parseFloat(combo.combo_price) || 0).toFixed(2);
    };

    const hasSizeVariants = fetchedItem && allItems.some((i) =>
        i.item_code.startsWith(fetchedItem.item_code.replace(/-[SML]$/, '')) &&
        ['-S', '-M', '-L'].some((suffix) => i.item_code.endsWith(suffix))
    );

    return (
        <div className="food-detail bg-dark">
            <div className="modal fade show d-block sec-modal">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{fetchedItem?.name || "Loading..."}</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            <div className="image-i-wrapper d-flex justify-content-center">
                                <div className="image-i">
                                    <img
                                        src={fetchedItem?.image || "default-image.jpg"}
                                        alt={fetchedItem?.name || "Item"}
                                        width={150}
                                        height={150}
                                        className="mb-3 rounded d-flex mx-auto"
                                    />
                                    <i className="fa-solid fa-info info-icon" onClick={() => setShowModal(true)}></i>
                                </div>
                            </div>

                            <p className="mb-0 text-center">
                                <strong>Category:</strong> {fetchedItem?.category || "N/A"}
                            </p>
                            <p className="text-center">
                                <strong>Item Total:</strong> ${itemTotal.toFixed(2)}
                            </p>
                            <div className="quantity-container">
                                <button className="quantity-btn minus" onClick={decreaseMainQuantity}>-</button>
                                <span className="quantity-value">{mainQuantity}</span>
                                <button className="quantity-btn plus" onClick={increaseMainQuantity}>+</button>
                            </div>

                            <div>
                                {hasSizeVariants && (
                                    <div className="mt-3">
                                        <strong>Size:</strong>
                                        <div className="btn-group w-100" role="group">
                                            {['S', 'M', 'L'].map((size) => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    className={`btn ${selectedSize === size ? 'btn-primary' : 'btn-outline-primary'}`}
                                                    onClick={() => handleSizeChange(size)}
                                                >
                                                    {size} (${(getSizePrices()[size] || 0).toFixed(2)})
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {fetchedItem?.variants?.length > 0 && (
                                    <div className="mt-3">
                                        <strong>Custom Variants:</strong>
                                        <div className="radio-inputs" role="group" aria-label="Custom variant selection">
                                            {fetchedItem.variants.map((variant, index) => (
                                                <label key={index} className="radio">
                                                    <input
                                                        type="radio"
                                                        name="customVariant"
                                                        value={variant.type_of_variants}
                                                        checked={selectedCustomVariant === variant.type_of_variants}
                                                        onChange={() => handleCustomVariantChange(variant.type_of_variants)}
                                                    />
                                                    <span className="name">
                                                        {variant.type_of_variants} {variant.variant_price ? `($${variant.variant_price.toFixed(2)})` : ''}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {fetchedItem?.addons?.length > 0 && (
                                    <div className="mt-3">
                                        <strong>Add-ons:</strong>
                                        <ul className="addons-list d-flex justify-content-evenly flex-wrap">
                                            {fetchedItem.addons.map((addon) => {
                                                const addonData = addonCounts[addon.name1] || { price: parseFloat(addon.addon_price) || 0, quantity: 0 };
                                                return (
                                                    <li key={addon.name1} className={`addon-item ${addonData.quantity > 0 ? 'selected' : ''}`}>
                                                        <img
                                                            src={addon.addon_image ? `http://109.199.100.136:6060${addon.addon_image}` : 'default-addon-image.jpg'}
                                                            width={75}
                                                            height={75}
                                                            className="mx-2 rounded"
                                                            alt={addon.name1}
                                                        />
                                                        <span>{addon.name1}</span>
                                                        <span>${addonData.price.toFixed(2)}</span>
                                                        <div className="quantity-container mt-2">
                                                            <button className="quantity-btn minus" onClick={() => toggleAddonSelection(addon, -1)} disabled={addonData.quantity <= 0}>-</button>
                                                            <span className="quantity-value">{addonData.quantity}</span>
                                                            <button className="quantity-btn plus" onClick={() => toggleAddonSelection(addon, 1)}>+</button>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}

                                {fetchedItem?.combos?.length > 0 && (
                                    <div>
                                        <div className="form-check mt-4">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={showCombos}
                                                onChange={() => setShowCombos(!showCombos)}
                                            />
                                            <label className="form-check-label">Show Combos</label>
                                        </div>
                                        {showCombos && (
                                            <div className="combo-list mt-3">
                                                <h5>Combo Options:</h5>
                                                <div className="row">
                                                    {fetchedItem.combos.map((combo) => {
                                                        const isSelected = selectedCombos.some((c) => c.name1 === combo.name1);
                                                        const comboData = selectedCombos.find((c) => c.name1 === combo.name1) || { quantity: 0 };
                                                        const comboItem = allItems.find((i) => i.item_name === combo.name1) || { has_variants: false };
                                                        const hasVariants = comboItem.has_variants || (comboItem.variants && comboItem.variants.length > 0);
                                                        return (
                                                            <div
                                                                key={combo.name1}
                                                                className={`col-lg-3 col-md-4 col-6 text-center mb-3 combo-item ${isSelected ? 'selected' : ''}`}
                                                                onClick={() => handleComboClick(combo)}
                                                            >
                                                                <div className="combo-option">
                                                                    <img
                                                                        src={combo.combo_image ? `http://109.199.100.136:6060${combo.combo_image}` : 'default-combo-image.jpg'}
                                                                        alt={combo.name1}
                                                                        width={100}
                                                                        height={70}
                                                                        className="rounded mb-2"
                                                                    />
                                                                    <p>{combo.name1}</p>
                                                                    <p>${getComboPriceDisplay(combo)}</p>
                                                                    {isSelected && (
                                                                        <div>
                                                                            {hasVariants && (
                                                                                <p>{comboData.selectedSize || ''} {comboData.selectedCustomVariant ? `- ${comboData.selectedCustomVariant}` : ''}</p>
                                                                            )}
                                                                            <div className="quantity-container mt-2">
                                                                                <button className="quantity-btn minus" onClick={(e) => { e.stopPropagation(); updateComboQuantity(combo.name1, -1); }} disabled={comboData.quantity <= 1}>-</button>
                                                                                <span className="quantity-value">{comboData.quantity}</span>
                                                                                <button className="quantity-btn plus" onClick={(e) => { e.stopPropagation(); updateComboQuantity(combo.name1, 1); }}>+</button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedCombo && (
                                    <div className="combo-popup card shadow">
                                        <div className="card-body">
                                            <h5 className="card-title text-center">Select Options for {selectedCombo.name1}</h5>
                                            <img
                                                src={selectedCombo.combo_image ? `http://109.199.100.136:6060${selectedCombo.combo_image}` : 'default-combo-image.jpg'}
                                                alt={selectedCombo.name1}
                                                width={80}
                                                height={80}
                                                className="mb-3 d-block mx-auto"
                                            />
                                            <div className="mt-3">
                                                <strong>Size (Required):</strong>
                                                <div className="btn-group w-100" role="group">
                                                    {['S', 'M', 'L'].map((size) => (
                                                        <button
                                                            key={size}
                                                            type="button"
                                                            className={`btn ${comboVariants[selectedCombo.name1]?.size === size ? 'btn-primary' : 'btn-outline-primary'}`}
                                                            onClick={() => setComboVariants((prev) => ({ ...prev, [selectedCombo.name1]: { ...prev[selectedCombo.name1], size } }))}
                                                        >
                                                            {size} (${getComboSizePrices(selectedCombo.name1)[size].toFixed(2)})
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            {allItems.find((i) => i.item_name === selectedCombo.name1)?.variants?.length > 0 && (
                                                <div className="mt-3">
                                                    <strong>Custom Variants (Optional):</strong>
                                                    <div className="radio-inputs" role="group">
                                                        {allItems.find((i) => i.item_name === selectedCombo.name1).variants.map((variant, index) => (
                                                            <label key={index} className="radio">
                                                                <input
                                                                    type="radio"
                                                                    name={`customVariant-${selectedCombo.name1}`}
                                                                    value={variant.type_of_variants}
                                                                    checked={comboVariants[selectedCombo.name1]?.custom === variant.type_of_variants}
                                                                    onChange={() => setComboVariants((prev) => ({ ...prev, [selectedCombo.name1]: { ...prev[selectedCombo.name1], custom: variant.type_of_variants } }))}
                                                                />
                                                                <span className="name">{variant.type_of_variants} {variant.variant_price ? `($${variant.variant_price.toFixed(2)})` : ''}</span>
                                                            </label>
                                                        ))}
                                                        <label className="radio">
                                                            <input
                                                                type="radio"
                                                                name={`customVariant-${selectedCombo.name1}`}
                                                                value=""
                                                                checked={!comboVariants[selectedCombo.name1]?.custom}
                                                                onChange={() => setComboVariants((prev) => ({ ...prev, [selectedCombo.name1]: { ...prev[selectedCombo.name1], custom: null } }))}
                                                            />
                                                            <span className="name">None</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="text-center mt-4">
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => {
                                                        const comboVariant = comboVariants[selectedCombo.name1];
                                                        if (!comboVariant?.size) {
                                                            alert(`Please select a size for ${selectedCombo.name1}.`);
                                                            return;
                                                        }
                                                        updateComboSelection(selectedCombo, comboVariant.size, comboVariant.custom);
                                                    }}
                                                >
                                                    Confirm
                                                </button>
                                                {selectedCombos.some((c) => c.name1 === selectedCombo.name1) && (
                                                    <button className="btn btn-danger ml-2" onClick={() => updateComboSelection(selectedCombo, null, null, true)}>Remove</button>
                                                )}
                                                <button className="btn btn-secondary ml-2" onClick={() => setSelectedCombo(null)}>Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {showModal && (
                                    <div className="modal-overlay">
                                        <div className="modal-content p-3">
                                            <span className="close-btn" role="button" onClick={() => setShowModal(false)}>×</span>
                                            {fetchedItem?.ingredients?.length > 0 ? (
                                                <div className="ingredient-container">
                                                    <h3 className="ingredient-title">Ingredients</h3>
                                                    <table className="ingredient-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Ingredient Name</th>
                                                                <th>Calories</th>
                                                                <th>Protein</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {fetchedItem.ingredients.map((ingredient, index) => (
                                                                <tr key={index}>
                                                                    <td>{ingredient.ingredients_name || 'N/A'}</td>
                                                                    <td>{ingredient.calories || 0}</td>
                                                                    <td>{ingredient.protein || 0}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="no-ingredients">No ingredients available</p>
                                            )}
                                            <div className="total-info">
                                                <table className="total-table">
                                                    <tbody>
                                                        <tr><td><strong>Total Calories:</strong></td><td>{fetchedItem?.calories || 0}</td></tr>
                                                        <tr><td><strong>Total Protein:</strong></td><td>{fetchedItem?.protein || 0}</td></tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn" onClick={onClose} style={{ backgroundColor: "#ecf0f1" }}>Close</button>
                            <button type="button" className="btn" onClick={handleAddToCart} style={{ backgroundColor: "#358ac2", color: "white" }}>Add To Cart</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FoodDetails;