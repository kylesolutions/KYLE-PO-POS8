import React, { useState, useEffect, useContext } from 'react';
import UserContext from '../../Context/UserContext';
import './foodDetails.css';

const FoodDetails = ({ item, onClose }) => {
    if (!item) return null;

    const { addToCart } = useContext(UserContext);
    const [selectedSize, setSelectedSize] = useState("M");
    const [addonCounts, setAddonCounts] = useState({});
    const [selectedCombo, setSelectedCombo] = useState(null);
    const [comboVariants, setComboVariants] = useState({});
    const [selectedCombos, setSelectedCombos] = useState([]);
    const [showCombos, setShowCombos] = useState(false);
    const [fetchedItem, setFetchedItem] = useState(null);
    const [allItems, setAllItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [mainQuantity, setMainQuantity] = useState(1); // Renamed for clarity
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
                console.log("Raw API Response:", data);

                let itemList;
                if (data && Array.isArray(data)) {
                    itemList = data;
                } else if (data && data.message && Array.isArray(data.message)) {
                    itemList = data.message;
                } else {
                    throw new Error("Invalid data structure");
                }

                const baseUrl = "http://109.199.100.136:6060/";
                setAllItems(itemList.map(item => ({
                    ...item,
                    variants: item.variants ? item.variants.map(v => ({
                        type_of_variants: v.type_of_variants,
                        variant_price: parseFloat(v.variants_price) || 0
                    })) : []
                })));
                const selectedItem = itemList.find((i) => i.name === item.name);

                if (selectedItem) {
                    const formattedAddonData = selectedItem.addons || [];
                    const formattedComboData = selectedItem.combos || [];
                    const formattedVariantData = (selectedItem.variants || []).map(v => ({
                        type_of_variants: v.type_of_variants,
                        variant_price: parseFloat(v.variants_price) || 0
                    }));
                    const formattedIngredientsData = selectedItem.ingredients || [];

                    setFetchedItem({
                        name: selectedItem.item_name,
                        category: selectedItem.item_group,
                        kitchen: selectedItem.kitchen,
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
                    });
                }
            } catch (error) {
                console.error("Error fetching item details:", error);
            }
        };
        fetchItemDetails();
    }, [item]);

    useEffect(() => {
        if (fetchedItem) {
            const basePrice = fetchedItem.price * mainQuantity; // Only main item price scales with quantity
            const addonsPrice = Object.entries(addonCounts).reduce((sum, [_, { price, quantity }]) => 
                sum + (price * quantity), 0); // Add-on price based on their own quantities
            const comboPrice = selectedCombos.reduce((sum, combo) => {
                const comboDetail = fetchedItem.combos.find(c => c.name1 === combo.name1);
                const comboBasePrice = comboDetail ? comboDetail.combo_price : 0;
                const variantPrice = combo.selectedVariant 
                    ? (allItems.find(i => i.name === combo.name1)?.variants.find(v => v.type_of_variants === combo.selectedVariant)?.variant_price || 0) 
                    : 0;
                return sum + comboBasePrice + variantPrice; // Combos treated as single units
            }, 0);
            const finalPrice = basePrice + addonsPrice + comboPrice;
            setItemTotal(finalPrice);
        }
    }, [addonCounts, selectedCombos, fetchedItem, mainQuantity]);

    const handleSizeChange = (size) => setSelectedSize(size);

    const toggleAddonSelection = (addon, qtyChange = 0) => {
        setAddonCounts((prev) => {
            const current = prev[addon.name1] || { price: 0, quantity: 0 };
            const newQuantity = Math.max(0, current.quantity + qtyChange);
            return {
                ...prev,
                [addon.name1]: {
                    price: addon.addon_price,
                    quantity: newQuantity
                }
            };
        });
    };

    const handleComboClick = (combo) => {
        const comboItem = allItems.find(i => i.name === combo.name1);
        if (comboItem && comboItem.custom_variant_applicable && comboItem.variants?.length > 0) {
            setSelectedCombo({ ...combo, variants: comboItem.variants });
        } else {
            toggleComboSelection(combo);
        }
    };

    const toggleComboSelection = (combo, variant = null) => {
        setSelectedCombos((prevCombos) => {
            const isAlreadySelected = prevCombos.some((selected) => selected.name1 === combo.name1);
            if (isAlreadySelected) {
                return prevCombos.filter((selected) => selected.name1 !== combo.name1);
            } else {
                return [...prevCombos, { ...combo, selectedVariant: variant }];
            }
        });
        if (variant) {
            const comboItem = allItems.find(i => i.name === combo.name1);
            const variantDetail = comboItem?.variants.find(v => v.type_of_variants === variant);
            const variantPrice = variantDetail?.variant_price || 0;
            setComboVariants((prev) => ({
                ...prev,
                [combo.name1]: { variant, price: variantPrice },
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

    const handleAddToCart = () => {
        const customizedItem = {
            id: item.id,
            name: item.name,
            image: item.image,
            category: item.category,
            basePrice: item.price,
            selectedSize,
            addonCounts: Object.fromEntries(
                Object.entries(addonCounts).filter(([_, { quantity }]) => quantity > 0)
            ),
            selectedCombos: selectedCombos.map((combo) => ({
                ...combo,
                selectedVariant: combo.selectedVariant || null,
                variantPrice: allItems.find(i => i.name === combo.name1)?.variants.find(v => v.type_of_variants === combo.selectedVariant)?.variant_price || 0,
            })),
            kitchen: item.kitchen,
            quantity: mainQuantity, // Renamed for clarity
        };
        console.log("Adding to cart:", customizedItem);
        addToCart(customizedItem);
        onClose();
    };

    const increaseMainQuantity = () => setMainQuantity(prevQuantity => prevQuantity + 1);

    const decreaseMainQuantity = () => {
        if (mainQuantity > 1) {
            setMainQuantity(prevQuantity => prevQuantity - 1);
        }
    };

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
                            <div className='image-i-wrapper d-flex justify-content-center'>
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
                                <strong>Main Item Quantity:</strong>
                                <button className="quantity-btn minus" onClick={decreaseMainQuantity}>−</button>
                                <span className="quantity-value">{mainQuantity}</span>
                                <button className="quantity-btn plus" onClick={increaseMainQuantity}>+</button>
                            </div>

                            <div>
                                {fetchedItem?.variants?.length > 0 && (
                                    <div className="mt-3">
                                        <strong>Variants:</strong>
                                        <div className="radio-inputs" role="group" aria-label="Variant selection">
                                            {fetchedItem.variants.map((variant, index) => (
                                                <label key={index} className="radio">
                                                    <input
                                                        type="radio"
                                                        name="variant"
                                                        value={variant.type_of_variants}
                                                        checked={selectedSize === variant.type_of_variants}
                                                        onChange={() => handleSizeChange(variant.type_of_variants)}
                                                    />
                                                    <span className="name">{variant.type_of_variants} {variant.variant_price ? `($${variant.variant_price})` : ''}</span>
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
                                                const addonData = addonCounts[addon.name1] || { price: addon.addon_price, quantity: 0 };
                                                const isSelected = addonData.quantity > 0;
                                                return (
                                                    <li
                                                        key={addon.name1}
                                                        className={`addon-item ${isSelected ? 'selected' : ''}`}
                                                    >
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
                                                        <span>${addon.addon_price}</span>
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
                                                                    <p>${combo.combo_price}</p>
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
                                            <h5 className="card-title text-center">
                                                Select Variant for {selectedCombo.name1}
                                            </h5>
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
                                                        {variant.type_of_variants} {variant.variant_price ? `($${variant.variant_price})` : ''}
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
                                                                    <td>{ingredient.ingredients_name || "N/A"}</td>
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
                                                            <td><strong>Total Calories:</strong></td>
                                                            <td>{fetchedItem?.calories || 0}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Total Protein:</strong></td>
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
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleAddToCart}
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