import React, { useState, useEffect, useContext } from 'react';
import UserContext from '../../Context/UserContext';
import './foodDetails.css';

const FoodDetails = ({ item, onClose }) => {
    if (!item) return null;

    const { addToCart, setTotalPrice, totalPrice } = useContext(UserContext);
    const sizePriceMultipliers = { S: 1.0, M: 1.2, L: 1.5 };
    const [selectedSize, setSelectedSize] = useState("M");
    const [addonCounts, setAddonCounts] = useState({});
    const [selectedAddon, setSelectedAddon] = useState(null);
    const [comboSizes, setComboSizes] = useState({});
    const [selectedCombos, setSelectedCombos] = useState([]);
    const [showCombos, setShowCombos] = useState(false);
    const [fetchedItem, setFetchedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);

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

                if (data && Array.isArray(data.message)) {
                    const baseUrl = "http://109.199.100.136:6060/";
                    const selectedItem = data.message.find((i) => i.name === item.name);

                    if (selectedItem) {
                        const formattedAddonData = selectedItem.addons || [];
                        const formattedComboData = selectedItem.combos || [];
                        const formattedIngredientsData = selectedItem.ingredients || [];

                        setFetchedItem({
                            name: selectedItem.item_name,
                            category: selectedItem.item_group,
                            image: selectedItem.image
                                ? `${baseUrl}${selectedItem.image}`
                                : "default-image.jpg",
                            price: selectedItem.price_list_rate || 0,
                            addons: formattedAddonData,
                            combos: formattedComboData,
                            ingredients: formattedIngredientsData,
                            calories: selectedItem.custom_total_calories,
                            protein: selectedItem.custom_total_protein,
                        });
                    }
                } else {
                    throw new Error("Invalid data structure");
                }
            } catch (error) {
                console.error("Error fetching item details:", error);
            }
        };
        fetchItemDetails();
    }, [item]);

    useEffect(() => {
        if (fetchedItem) {
            const basePrice = fetchedItem.price;

            const addonsPrice = Object.entries(addonCounts).reduce((sum, [addonName, price]) => sum + price, 0);

            const comboPrice = selectedCombos.reduce((sum, combo) => {
                const comboDetail = fetchedItem.combos.find(c => c.name1 === combo.name1);
                // const comboSize = comboSizes[combo.name1] || 'M';
                // const multiplier = sizePriceMultipliers[comboSize];
                const comboBasePrice = comboDetail ? comboDetail.combo_price : 0;
                return sum + comboBasePrice;
            }, 0);

            const finalPrice = basePrice + addonsPrice + comboPrice;
            setTotalPrice(finalPrice);
        }
    }, [selectedSize, addonCounts, selectedCombos, comboSizes, fetchedItem, setTotalPrice]);

    const handleSizeChange = (size) => setSelectedSize(size);

    const handleAddonCheck = (addon, checked) => {
        setAddonCounts((prev) => ({
            ...prev,
            [addon.name1]: checked ? addon.addon_price : 0,
        }));
        handleAddonChange(addon.addon_price, checked);
    };

    const handleAddonChange = (addonPrice, isChecked) => {
        setTotalPrice((prevPrice) =>
            isChecked ? prevPrice + addonPrice : prevPrice - addonPrice
        );
    };

    const openAddonPopup = (addon) => setSelectedAddon(addon);

    const closeAddonPopup = () => {
        if (selectedAddon && addonCounts[selectedAddon.name1] === undefined) {
            setAddonCounts((prev) => ({ ...prev, [selectedAddon.name1]: 0 }));
        }
        setSelectedAddon(null);
    };

    const toggleComboSelection = (combo) => {
        setSelectedCombos((prevCombos) => {
            const isAlreadySelected = prevCombos.some((selected) => selected.name1 === combo.name1);
            if (isAlreadySelected) {
                return prevCombos.filter((selected) => selected.name1 !== combo.name1);
            } else {
                return [...prevCombos, combo];
            }
        });

        setComboSizes((prevSizes) => {
            if (prevSizes[combo.name1]) {
                const newSizes = { ...prevSizes };
                delete newSizes[combo.name1];
                return newSizes;
            } else {
                return { ...prevSizes, [combo.name1]: 'M' };
            }
        });
    };


    const handleAddToCart = () => {
        const customizedItem = {
            id: item.id,
            name: item.name,
            image: item.image,
            category: item.category,
            basePrice: item.price,
            selectedSize,
            addonCounts,
            selectedCombos: selectedCombos.map((combo) => ({
                ...combo,
                size: comboSizes[combo.name1] || "M",
                price: 50 * sizePriceMultipliers[comboSizes[combo.name1] || "M"],
            })),
            selectedAddon,
            totalPrice,
        };
        addToCart(customizedItem);
        onClose();
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
                                        width={100}
                                        height={100}
                                        className="mb-3 rounded d-flex mx-auto"
                                    />
                                    <i className="fa-solid fa-info info-icon" onClick={() => setShowModal(true)}></i>
                                </div>
                            </div>

                            <p className="mb-0 text-center">
                                <strong>Category:</strong> {fetchedItem?.category}
                            </p>
                            <p className="text-center">
                                <strong>Total Price:</strong> ${totalPrice.toFixed(2)}
                            </p>

                            <div>
                                {fetchedItem?.variants?.length > 0 && (
                                    <div className="radio-inputs" role="group" aria-label="Size selection">
                                        {Object.keys(sizePriceMultipliers).map((size) => (
                                            <label key={size} className="radio">
                                                <input
                                                    type="radio"
                                                    name="size"
                                                    value={size}
                                                    checked={selectedSize === size}
                                                    onChange={() => handleSizeChange(size)}
                                                />
                                                <span className="name">{size}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {fetchedItem?.addons?.length > 0 && (
                                    <div className="mt-3">
                                        <strong>Add-ons:</strong>
                                        <ul className="addons-list d-flex justify-content-evenly">
                                            {fetchedItem.addons.map((addon) => {
                                                const baseUrl = 'http://109.199.100.136:6060/';
                                                return (
                                                    <li key={addon.name1} className="addon-item">
                                                        <input
                                                            type="checkbox"
                                                            checked={addonCounts[addon.name1] > 0 || false}
                                                            onChange={(e) =>
                                                                handleAddonCheck(addon, e.target.checked)
                                                            }
                                                        />
                                                        <img
                                                            src={addon.addon_image ? `${baseUrl}${addon.addon_image}` : 'default-addon-image.jpg'}
                                                            width={50}
                                                            height={50}
                                                            className="mx-2 rounded"
                                                            alt={addon.name1}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'default-addon-image.jpg';
                                                            }}
                                                        />
                                                        <span>{addon.name1}</span>
                                                        <span>${addon.addon_price}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}

                                {selectedAddon && (
                                    <div className="addon-popup card shadow">
                                        <div className="card-body">
                                            <h5 className="card-title text-center">
                                                Customize Add-on: {selectedAddon.name1}
                                            </h5>
                                            <img
                                                src={selectedAddon.addon_image ? `${baseUrl}${selectedAddon.addon_image}` : 'default-addon-image.jpg'}
                                                alt={selectedAddon.name1}
                                                width={80}
                                                height={80}
                                                className="mb-3"
                                            />
                                            <div className="text-center mt-4">
                                                <button className="btn" onClick={closeAddonPopup}>
                                                    Done
                                                </button>
                                            </div>
                                        </div>
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
                                                    {fetchedItem.combos.map((combo) => (
                                                        <div
                                                            key={combo.name1}
                                                            className={`col-lg-3 col-md-4 col-6 text-center mb-3 ${selectedCombos.some((selected) => selected.name1 === combo.name1) ? 'selected' : ''
                                                                }`}
                                                            onClick={() => toggleComboSelection(combo)}
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
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {showModal && (
                                    <div className="modal-overlay">
                                        <div className="modal-content">
                                            <span className="close-btn" role="button" onClick={() => setShowModal(false)}>&times;</span>
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
                                                <p>No ingredients available</p>
                                            )}

                                            <div className="total-info">
                                                <table className="total-table">
                                                    <tbody>
                                                        <tr>
                                                            <td><strong>Total Calories:</strong></td>
                                                            <td>{fetchedItem?.calories}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Total Protein:</strong></td>
                                                            <td>{fetchedItem?.protein}</td>
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
