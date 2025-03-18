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
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                console.log("Raw API Response:", JSON.stringify(data, null, 2));

                let itemList;
                if (data && Array.isArray(data)) {
                    itemList = data;
                } else if (data && data.message && Array.isArray(data.message)) {
                    itemList = data.message;
                } else {
                    throw new Error("Invalid data structure");
                }

                const baseUrl = "http://109.199.100.136:6060/";
                setAllItems(
                    itemList.map((item) => ({
                        ...item,
                        variants: item.variants
                            ? item.variants.map((v) => ({
                                  type_of_variants: v.type_of_variants,
                                  variant_price: parseFloat(v.variants_price) || 0,
                              }))
                            : [],
                        image: item.image ? `${baseUrl}${item.image}` : "default-image.jpg",
                    }))
                );
                const selectedItem = itemList.find((i) => i.name === item.name);

                if (selectedItem) {
                    const formattedAddonData = selectedItem.addons || [];
                    const formattedComboData = selectedItem.combos || [];
                    const formattedVariantData = (selectedItem.variants || []).map((v) => ({
                        type_of_variants: v.type_of_variants,
                        variant_price: parseFloat(v.variants_price) || 0,
                    }));
                    const formattedIngredientsData = selectedItem.ingredients || [];

                    setFetchedItem({
                        item_code: selectedItem.item_code,
                        name: selectedItem.item_name,
                        category: selectedItem.item_group,
                        kitchen: selectedItem.custom_kitchen,
                        image: selectedItem.image
                            ? `${baseUrl}${selectedItem.image}`
                            : "default-image.jpg",
                        price: selectedItem.price_list_rate || 0,
                        addons: formattedAddonData,
                        combos: formattedComboData,
                        variants: formattedVariantData,
                        ingredients: formattedIngredientsData,
                        calories: selectedItem.custom_total_calories,
                        protein: selectedItem.custom_total_protein,
                        has_variants: selectedItem.has_variants || false,
                    });
                    const hasSizeVariants = itemList.some((i) =>
                        i.item_code.startsWith(selectedItem.item_code.replace(/-[SML]$/, '')) &&
                        ['-S', '-M', '-L'].some((suffix) => i.item_code.endsWith(suffix))
                    );
                    if (hasSizeVariants) {
                        setSelectedSize("M");
                    }
                    if (formattedVariantData.length > 0) {
                        setSelectedCustomVariant(formattedVariantData[0].type_of_variants);
                    }
                }
            } catch (error) {
                console.error("Error fetching item details:", error);
            }
        };
        fetchItemDetails();
    }, [item]);

    useEffect(() => {
        if (fetchedItem) {
            const sizePrices = getSizePrices();
            const selectedItemCode = getItemCodeForSize(selectedSize);
            const selectedItem = allItems.find((i) => i.item_code === selectedItemCode) || fetchedItem;
            const basePrice = (selectedSize ? sizePrices[selectedSize] : fetchedItem.price) * mainQuantity;
            const customVariantPrice = selectedCustomVariant
                ? (fetchedItem.variants.find((v) => v.type_of_variants === selectedCustomVariant)?.variant_price || 0) * mainQuantity
                : 0;
            const addonsPrice = Object.entries(addonCounts).reduce(
                (sum, [_, { price, quantity }]) => sum + price * quantity,
                0
            );
            const comboPrice = selectedCombos.reduce((sum, combo) => {
                const comboDetail = fetchedItem.combos.find((c) => c.name1 === combo.name1);
                const comboBasePrice = comboDetail ? parseFloat(comboDetail.combo_price) || 0 : 0;
                const variantPrice = combo.selectedVariant
                    ? (allItems.find((i) => i.item_name === combo.name1)?.variants.find((v) => v.type_of_variants === combo.selectedVariant)?.variant_price || 0)
                    : 0;
                return sum + (comboBasePrice + variantPrice) * combo.quantity;
            }, 0);
            const finalPrice = basePrice + customVariantPrice + addonsPrice + comboPrice;
            console.log("Price Breakdown:", { basePrice, customVariantPrice, addonsPrice, comboPrice, finalPrice });
            setItemTotal(finalPrice);
        }
    }, [addonCounts, selectedCombos, fetchedItem, mainQuantity, selectedSize, selectedCustomVariant, allItems]);

    const getSizePrices = () => {
        if (!fetchedItem || !fetchedItem.item_code) return { S: 0, M: 0, L: 0 };
        const baseItemCode = fetchedItem.item_code.replace(/-[SML]$/, '');
        const sizePrices = { S: fetchedItem.price || 0, M: fetchedItem.price || 0, L: fetchedItem.price || 0 };
        const sizeItems = allItems.filter((i) =>
            i.item_code.startsWith(baseItemCode) && ['-S', '-M', '-L'].some((suffix) => i.item_code.endsWith(suffix))
        );
        sizeItems.forEach((sizeItem) => {
            if (sizeItem.item_code.endsWith('-S')) sizePrices.S = sizeItem.price_list_rate || sizePrices.S;
            if (sizeItem.item_code.endsWith('-M')) sizePrices.M = sizeItem.price_list_rate || sizePrices.M;
            if (sizeItem.item_code.endsWith('-L')) sizePrices.L = sizeItem.price_list_rate || sizePrices.L;
        });
        return sizePrices;
    };

    const getItemCodeForSize = (size) => {
        if (!fetchedItem || !fetchedItem.item_code || !size) return fetchedItem.item_code;
        const baseItemCode = fetchedItem.item_code.replace(/-[SML]$/, '');
        const sizeItem = allItems.find((i) => i.item_code === `${baseItemCode}-${size}`);
        return sizeItem ? sizeItem.item_code : fetchedItem.item_code;
    };

    const getItemNameForSize = (size) => {
        if (!fetchedItem || !fetchedItem.item_code || !size) return fetchedItem.name;
        const baseItemCode = fetchedItem.item_code.replace(/-[SML]$/, '');
        const sizeItem = allItems.find((i) => i.item_code === `${baseItemCode}-${size}`);
        return sizeItem ? sizeItem.item_name : fetchedItem.name;
    };

    const getComboVariantItemCode = (comboName, variant, isCustomVariant) => {
        const comboItem = allItems.find((i) => i.item_name === comboName);
        if (!comboItem) {
            console.error(`Combo item ${comboName} not found in allItems`);
            return comboName;
        }
    
        if (comboItem.has_variants && variant && !isCustomVariant) {
            const variantItem = allItems.find((i) =>
                i.variant_of === comboItem.name &&
                (i.item_code.includes(variant) || i.item_name.includes(variant))
            ) || allItems.find((i) => i.item_code === `${comboItem.item_code}-${variant}`);
            if (variantItem) {
                console.log(`Resolved size variant ${variant} for ${comboName} to item_code: ${variantItem.item_code}`);
                return variantItem.item_code;
            } else {
                console.error(`Size variant ${variant} for ${comboName} not found in allItems`);
                throw new Error(`Size variant ${comboItem.item_code}-${variant} not found`);
            }
        }
        // For custom variants, return the template item_code
        console.log(`Using template item_code ${comboItem.item_code} for custom variant ${variant}`);
        return comboItem.item_code;
    };

    const handleSizeChange = (size) => setSelectedSize(size);

    const handleCustomVariantChange = (variant) => setSelectedCustomVariant(variant);

    const toggleAddonSelection = (addon, qtyChange = 0) => {
        setAddonCounts((prev) => {
            const current = prev[addon.name1] || { price: 0, quantity: 0 };
            const newQuantity = Math.max(0, current.quantity + qtyChange);
            return {
                ...prev,
                [addon.name1]: { price: addon.addon_price || 0, quantity: newQuantity },
            };
        });
    };

    const toggleComboSelection = (combo, variant = null, isCustomVariant = false) => {
        const comboItem = allItems.find((i) => i.item_name === combo.name1);
        if ((comboItem?.has_variants || comboItem?.variants?.length > 0) && !variant) {
            console.warn(`Cannot toggle ${combo.name1} without selecting a variant (template item)`);
            return;
        }
    
        setSelectedCombos((prevCombos) => {
            const isAlreadySelected = prevCombos.some((selected) => selected.name1 === combo.name1);
            if (isAlreadySelected) {
                return prevCombos.filter((selected) => selected.name1 !== combo.name1);
            } else {
                return [...prevCombos, { ...combo, selectedVariant: variant, isCustomVariant, quantity: 1 }];
            }
        });
    
        if (variant) {
            const variantDetail = comboItem?.variants.find((v) => v.type_of_variants === variant);
            const variantPrice = variantDetail?.variant_price || 0;
            setComboVariants((prev) => ({
                ...prev,
                [combo.name1]: { variant, price: variantPrice, isCustomVariant },
            }));
        } else {
            setComboVariants((prev) => {
                const newVariants = { ...prev };
                delete newVariants[combo.name1];
                return newVariants;
            });
        }
        setSelectedCombo(null);
    };

    const handleComboClick = (combo) => {
        const comboItem = allItems.find((i) => i.item_name === combo.name1);
        if (!comboItem) {
            console.error(`Combo item ${combo.name1} not found in allItems`);
            toggleComboSelection(combo);
            return;
        }
    
        const hasVariants = comboItem.has_variants || comboItem.variants?.length > 0;
        if (hasVariants) {
            // Custom variants from Pos Variants Type
            let availableVariants = comboItem.variants?.length > 0
                ? comboItem.variants.map(v => ({ ...v, isCustomVariant: true }))
                : [];
    
            // Size variants from allItems
            const sizeVariants = allItems
                .filter((i) => i.item_code.startsWith(comboItem.item_code + '-') && ['-S', '-M', '-L'].some(suffix => i.item_code.endsWith(suffix)))
                .map((v) => ({
                    type_of_variants: v.item_code.replace(comboItem.item_code + '-', ''),
                    variant_price: v.price_list_rate,
                    isCustomVariant: false
                }));
    
            // Combine and deduplicate
            availableVariants = [...availableVariants, ...sizeVariants].reduce((unique, v) => {
                if (!unique.some(u => u.type_of_variants === v.type_of_variants)) {
                    unique.push(v);
                }
                return unique;
            }, []);
    
            if (availableVariants.length > 0) {
                console.log(`Available variants for ${combo.name1}:`, availableVariants);
                setSelectedCombo({ ...combo, variants: availableVariants });
            } else {
                console.warn(`No variant items found for ${combo.name1}. Treating as non-variant item.`);
                toggleComboSelection(combo);
            }
        } else {
            toggleComboSelection(combo);
        }
    };

    const updateComboQuantity = (comboName, qtyChange) => {
        setSelectedCombos((prevCombos) =>
            prevCombos.map((combo) => {
                if (combo.name1 === comboName) {
                    const newQuantity = Math.max(1, combo.quantity + qtyChange);
                    return { ...combo, quantity: newQuantity };
                }
                return combo;
            })
        );
    };

    const handleAddToCart = () => {
        const sizePrices = getSizePrices();
        const selectedItemCode = getItemCodeForSize(selectedSize);
        const selectedItemName = getItemNameForSize(selectedSize);
        const selectedItem = allItems.find((i) => i.item_code === selectedItemCode) || fetchedItem;
    
        const customVariantPrice = selectedCustomVariant
            ? fetchedItem.variants.find((v) => v.type_of_variants === selectedCustomVariant)?.variant_price || 0
            : 0;
    
        try {
            const customizedItem = {
                id: selectedItemCode,
                name: selectedItemName,
                image: selectedItem.image || item.image,
                category: selectedItem.item_group || item.category,
                basePrice: selectedSize ? sizePrices[selectedSize] : selectedItem.price || item.price,
                customVariantPrice: customVariantPrice,
                selectedSize: selectedSize || null,
                selectedCustomVariant: selectedCustomVariant || null,
                addonCounts: Object.fromEntries(
                    Object.entries(addonCounts).filter(([_, { quantity }]) => quantity > 0)
                ),
                selectedCombos: selectedCombos.map((combo) => {
                    const comboItem = allItems.find((i) => i.item_name === combo.name1);
                    const isCustomVariant = combo.isCustomVariant || false;
                    const variantItemCode = getComboVariantItemCode(combo.name1, combo.selectedVariant, isCustomVariant);
                    const variantPrice = combo.selectedVariant && isCustomVariant
                        ? comboItem?.variants.find((v) => v.type_of_variants === combo.selectedVariant)?.variant_price || 0
                        : 0;
                    return {
                        ...combo,
                        item_code: variantItemCode,
                        selectedVariant: combo.selectedVariant || null,
                        custom_variant: isCustomVariant ? combo.selectedVariant : null, // Pass custom variant separately
                        variantPrice: variantPrice,
                        quantity: combo.quantity,
                        kitchen: comboItem?.custom_kitchen || combo.kitchen || "Unknown",
                    };
                }),
                kitchen: selectedItem.custom_kitchen || item.kitchen,
                quantity: mainQuantity,
            };
    
            console.log("Adding to cart:", JSON.stringify(customizedItem, null, 2));
            addToCart(customizedItem);
            onClose();
        } catch (error) {
            console.error("Error adding to cart:", error.message);
            alert(error.message);
        }
    };

    const increaseMainQuantity = () => setMainQuantity((prevQuantity) => prevQuantity + 1);

    const decreaseMainQuantity = () => {
        if (mainQuantity > 1) {
            setMainQuantity((prevQuantity) => prevQuantity - 1);
        }
    };

    const sizePrices = getSizePrices();
    const hasSizeVariants =
        fetchedItem &&
        typeof fetchedItem.item_code === 'string' &&
        allItems.some((i) =>
            i.item_code.startsWith(fetchedItem.item_code.replace(/-[SML]$/, '')) &&
            ['-S', '-M', '-L'].some((suffix) => i.item_code.endsWith(suffix))
        );

    return (
        <div className="food-detail bg-dark">
            <div className="modal fade show d-block sec-modal">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{fetchedItem?.name}</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            <div className="image-i-wrapper d-flex justify-content-center">
                                <div className="image-i">
                                    <img
                                        src={fetchedItem?.image}
                                        alt={fetchedItem?.name}
                                        width={150}
                                        height={150}
                                        className="mb-3 rounded d-flex mx-auto"
                                    />
                                    <i className="fa-solid fa-info info-icon" onClick={() => setShowModal(true)}></i>
                                </div>
                            </div>

                            <p className="mb-0 text-center">
                                <strong>Category:</strong> {fetchedItem?.category}
                            </p>
                            <p className="text-center">
                                <strong>Item Total:</strong> ${itemTotal.toFixed(2)}
                            </p>
                            <div className="quantity-container">
                                <button className="quantity-btn minus" onClick={decreaseMainQuantity}>
                                    −
                                </button>
                                <span className="quantity-value">{mainQuantity}</span>
                                <button className="quantity-btn plus" onClick={increaseMainQuantity}>
                                    +
                                </button>
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
                                                    {size} (${sizePrices[size].toFixed(2)})
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
                                                        {variant.type_of_variants} {variant.variant_price ? `($${variant.variant_price})` : ''}
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
                                                const baseUrl = 'http://109.199.100.136:6060/';
                                                const addonData = addonCounts[addon.name1] || { price: addon.addon_price || 0, quantity: 0 };
                                                const isSelected = addonData.quantity > 0;
                                                return (
                                                    <li key={addon.name1} className={`addon-item ${isSelected ? 'selected' : ''}`}>
                                                        <img
                                                            src={addon.addon_image ? `${baseUrl}${addon.addon_image}` : 'default-addon-image.jpg'}
                                                            width={75}
                                                            height={75}
                                                            className="mx-2 rounded"
                                                            alt={addon.name1}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'default-addon-image.jpg';
                                                            }}
                                                        />
                                                        <span>{addon.name1}</span>
                                                        <span>${(addon.addon_price || 0).toFixed(2)}</span>
                                                        <div className="quantity-container mt-2">
                                                            <button
                                                                className="quantity-btn minus"
                                                                onClick={() => toggleAddonSelection(addon, -1)}
                                                                disabled={addonData.quantity <= 0}
                                                            >
                                                                −
                                                            </button>
                                                            <span className="quantity-value">{addonData.quantity}</span>
                                                            <button
                                                                className="quantity-btn plus"
                                                                onClick={() => toggleAddonSelection(addon, 1)}
                                                            >
                                                                +
                                                            </button>
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
                                                        const isSelected = selectedCombos.some((selected) => selected.name1 === combo.name1);
                                                        const comboData = selectedCombos.find((selected) => selected.name1 === combo.name1) || { quantity: 0 };
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
                                                                    <p>${(combo.combo_price || 0).toFixed(2)}</p>
                                                                    {isSelected && (
                                                                        <div className="quantity-container mt-2">
                                                                            <button
                                                                                className="quantity-btn minus"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    updateComboQuantity(combo.name1, -1);
                                                                                }}
                                                                                disabled={comboData.quantity <= 1}
                                                                            >
                                                                                −
                                                                            </button>
                                                                            <span className="quantity-value">{comboData.quantity}</span>
                                                                            <button
                                                                                className="quantity-btn plus"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    updateComboQuantity(combo.name1, 1);
                                                                                }}
                                                                            >
                                                                                +
                                                                            </button>
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
                                            <h5 className="card-title text-center">Select Variant for {selectedCombo.name1}</h5>
                                            <img
                                                src={selectedCombo.combo_image ? `http://109.199.100.136:6060${selectedCombo.combo_image}` : 'default-combo-image.jpg'}
                                                alt={selectedCombo.name1}
                                                width={80}
                                                height={80}
                                                className="mb-3 d-block mx-auto"
                                            />
                                            <div className="variant-options">
                                                {selectedCombo.variants.map((variant, index) => (
                                                    <button
                                                        key={index}
                                                        className={`btn ${comboVariants[selectedCombo.name1]?.variant === variant.type_of_variants ? 'btn-primary' : 'btn-outline-secondary'} m-2`}
                                                        onClick={() => toggleComboSelection(selectedCombo, variant.type_of_variants)}
                                                    >
                                                        {variant.type_of_variants} {variant.variant_price ? `($${variant.variant_price.toFixed(2)})` : ''}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="text-center mt-4">
                                                <button className="btn btn-secondary" onClick={() => setSelectedCombo(null)}>
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {showModal && (
                                    <div className="modal-overlay">
                                        <div className="modal-content p-3">
                                            <span className="close-btn" role="button" onClick={() => setShowModal(false)}>
                                                ×
                                            </span>
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
                                                        <tr>
                                                            <td>
                                                                <strong>Total Calories:</strong>
                                                            </td>
                                                            <td>{fetchedItem?.calories || 0}</td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <strong>Total Protein:</strong>
                                                            </td>
                                                            <td>{fetchedItem?.protein || 0}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn" onClick={onClose} style={{ backgroundColor: "#ecf0f1" }}>
                                Close
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={handleAddToCart}
                                style={{ backgroundColor: "#358ac2", color: "white" }}
                            >
                                Add To Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FoodDetails;