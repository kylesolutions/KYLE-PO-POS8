import React, { useContext, useEffect, useState } from 'react';
import UserContext from '../../Context/UserContext';
import './front.css';
import { useLocation, useNavigate } from 'react-router-dom';
import FoodDetails from './FoodDetails';
import { v4 as uuidv4 } from 'uuid';
import SavedOrder from './SavedOrder';
import { useSelector } from 'react-redux';
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

function Front() {
    const [allItems, setAllItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("null");
    const [selectedItem, setSelectedItem] = useState(null);
    const [categories, setCategories] = useState([]);
    const [showButtons, setShowButtons] = useState(false);
    const { cartItems, addToCart, removeFromCart, updateCartItem, setCartItems } = useContext(UserContext);
    const location = useLocation();
    const { state } = useLocation();
    const { tableNumber: initialTableNumber, existingOrder, deliveryType: initialDeliveryType } = state || {};
    const userData = useSelector((state) => state.user);
    const company = userData.company || "POS8";
    const [defaultIncomeAccount, setDefaultIncomeAccount] = useState(userData.defaultIncomeAccount);
    const [taxTemplateName, setTaxTemplateName] = useState("");
    const [taxRate, setTaxRate] = useState(null);
    const [isPhoneNumberSet, setIsPhoneNumberSet] = useState(false);
    const [savedOrders, setSavedOrders] = useState([]);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [customers, setCustomers] = useState([]);
    const [customerName, setCustomerName] = useState("One Time Customer");
    const [newCustomerName, setNewCustomerName] = useState("");
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    const [bookedTables, setBookedTables] = useState([]);
    const allowedItemGroups = useSelector((state) => state.user.allowedItemGroups);
    const [address, setAddress] = useState("");
    const [watsappNumber, setWatsappNumber] = useState(""); 
    const [email, setEmail] = useState("");
    const [bearer,setBearer] = useState(userData.user)
    const [showBillModal, setShowBillModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [tableNumber, setTableNumber] = useState(initialTableNumber || "");
    const [deliveryType, setDeliveryType] = useState(initialDeliveryType || "");

    useEffect(() => {
        if (location.state) {
            const { customerName: stateCustomerName, phoneNumber: statePhoneNumber, tableNumber: stateTableNumber, existingOrder } = location.state;
            const finalCustomerName = stateCustomerName || existingOrder?.customer || "One Time Customer";
            const finalPhoneNumber = statePhoneNumber || existingOrder?.contact_mobile || "";
            const finalTableNumber = stateTableNumber || existingOrder?.custom_table_number || "";
            const finalDeliveryType = location.state.deliveryType || existingOrder?.custom_delivery_type || "";
            const finalCartItems = existingOrder?.cartItems || [];
            const finalAddress = existingOrder?.customer_address || "";
            const finalWatsappNumber = existingOrder?.contact_mobile || ""; 
            const finalEmail = existingOrder?.contact_email || "";

            setCustomerName(finalCustomerName);
            setCustomerInput(finalCustomerName);
            setPhoneNumber(finalPhoneNumber);
            setTableNumber(finalTableNumber);
            setDeliveryType(finalDeliveryType);
            setAddress(finalAddress);
            setWatsappNumber(finalWatsappNumber); 
            setEmail(finalEmail);
            setIsPhoneNumberSet(!!finalPhoneNumber);
            setCartItems(finalCartItems);
        } else {
            setCustomerName("One Time Customer");
            setCustomerInput("");
            setPhoneNumber("");
            setTableNumber("");
            setDeliveryType("");
            setAddress("");
            setWatsappNumber(""); 
            setEmail("");
            setIsPhoneNumberSet(false);
            setCartItems([]);
        }
    }, [location.state, setCartItems]);

    useEffect(() => {
        const fetchCompanyDetails = async () => {
            try {
                const response = await fetch('/api/method/frappe.client.get_value', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
                    },
                    body: JSON.stringify({
                        doctype: "Company",
                        name: company,
                        fieldname: ["default_income_account", "custom_tax_type"]
                    }),
                });
                const data = await response.json();
                if (data.message) {
                    setDefaultIncomeAccount(data.message.default_income_account || "Sales - P");
                    const taxTemplate = data.message.custom_tax_type;
                    if (taxTemplate) {
                        setTaxTemplateName(taxTemplate);
                        fetchTaxRate(taxTemplate);
                    } else {
                        fetchTaxRate(null);
                    }
                } else {
                    fetchTaxRate(null);
                }
            } catch (error) {
                console.error("Error fetching company details:", error);
                fetchTaxRate(null);
            }
        };

        const fetchTaxRate = async (templateName) => {
            try {
                const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_sales_taxes_details', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
                    },
                });
                const data = await response.json();
                if (data.message && Array.isArray(data.message)) {
                    if (templateName) {
                        const tax = data.message.find(t => t.name === templateName);
                        if (tax && tax.sales_tax && tax.sales_tax.length > 0) {
                            const rate = parseFloat(tax.sales_tax[0].rate) || 0;
                            setTaxRate(rate);
                            setTaxTemplateName(taxTemplate);
                        } else {
                            console.warn(`No tax rate found for ${templateName}. Using first available template.`);
                        }
                    }
                    if (!templateName || !data.message.some(t => t.name === templateName)) {
                        const defaultTax = data.message[0];
                        if (defaultTax && defaultTax.sales_tax && defaultTax.sales_tax.length > 0) {
                            const rate = parseFloat(defaultTax.sales_tax[0].rate) || 0;
                            setTaxRate(rate);
                            setTaxTemplateName(defaultTax.name);
                        } else {
                            setTaxRate(0);
                            setTaxTemplateName("");
                        }
                    }
                } else {
                    setTaxRate(0);
                    setTaxTemplateName("");
                }
            } catch (error) {
                console.error("Error fetching tax rate:", error);
                setTaxRate(0);
                setTaxTemplateName("");
            }
        };

        fetchCompanyDetails();
    }, [company]);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_kyle_item_details', {
                    method: 'GET',
                    headers: {
                        Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const data = await response.json();

                const baseUrl = 'http://109.199.100.136:6060/';
                const formattedItems = data.message
                    .filter(item => item && typeof item === 'object')
                    .map((item) => ({
                        id: uuidv4(),
                        name: item.item_name || 'Unnamed Item',
                        category: item.item_group || 'Uncategorized',
                        image: item.image ? `${baseUrl}${item.image}` : 'default-image.jpg',
                        price: parseFloat(item.price_list_rate) || 0,
                        item_code: item.item_code || '',
                        variants: Array.isArray(item.variants) ? item.variants.map((v) => ({
                            type_of_variants: v.type_of_variants || '',
                            item_code: v.item_code || `${item.item_code}-${v.type_of_variants}`,
                            variant_price: parseFloat(v.variants_price) || 0,
                        })) : [],
                        customVariants: item.custom_variant_applicable ? ['Spicy', 'Non-Spicy'] : [],
                        addons: Array.isArray(item.addons) ? item.addons.map((addon) => ({
                            name: addon.name || addon.item_name || "Unnamed Addon",
                            price: parseFloat(addon.price || addon.price_list_rate) || 0,
                            kitchen: addon.kitchen || addon.custom_kitchen || "Unknown",
                        })) : [],
                        combos: Array.isArray(item.combos) ? item.combos.map((combo) => ({
                            name1: combo.name1 || combo.item_name || "Unnamed Combo",
                            combo_price: parseFloat(combo.price || combo.combo_price || combo.price_list_rate) || 0,
                            kitchen: combo.kitchen || combo.custom_kitchen || "Unknown",
                            variants: Array.isArray(combo.variants) ? combo.variants : [],
                        })) : [],
                        ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
                        kitchen: item.custom_kitchen || "Unknown",
                        type: item.type || "regular",
                        has_variants: item.has_variants || false,
                    }))
                    .filter(item => item !== null && item !== undefined);

                const validItems = formattedItems.filter(item => {
                    if (!item || typeof item !== 'object' || !('variants' in item)) return false;
                    return true;
                });

                const initialFilteredItems = validItems.filter((item) => {
                    const isMainItem = (Array.isArray(item.variants) && item.variants.length > 0) ||
                        !["-S", "-M", "-L"].some(suffix => (item.item_code || '').endsWith(suffix));
                    return isMainItem &&
                        ((allowedItemGroups || []).length === 0 || (allowedItemGroups || []).includes(item.category)) &&
                        item.type !== "addon" &&
                        item.type !== "combo";
                });

                setAllItems(validItems);
                setFilteredItems(initialFilteredItems);
                const uniqueCategories = [...new Set(validItems.map((item) => (item.category || '').toLowerCase()))];
                setCategories(uniqueCategories);
            } catch (error) {
                console.error('Error fetching items:', error);
                setAllItems([]);
                setFilteredItems([]);
                setCategories([]);
            }
        };

        fetchItems();
    }, [allowedItemGroups]);

    const handleFilter = (category) => {
        const filtered = allItems.filter(item => {
            const isMainItem = ((item.variants || []).length > 0) ||
                !["-S", "-M", "-L"].some(suffix => (item.item_code || '').endsWith(suffix));
            return isMainItem &&
                (category === "All" || (item.category || '').toLowerCase() === category.toLowerCase()) &&
                item.type !== "addon" &&
                item.type !== "combo";
        });
        setFilteredItems(filtered);
        setSelectedCategory(category);
    };

    const handlePhoneNumberChange = (e) => setPhoneNumber(e.target.value);

    const handleSetPhoneNumber = () => {
        if (phoneNumber.trim() === "") {
            alert("Please enter a valid phone number.");
            return;
        }
        setIsPhoneNumberSet(true);
    };

    const handleItemClick = (item) => setSelectedItem(item);

    const handleItemUpdate = (updatedItem) => {
        updateCartItem(updatedItem);
        setSelectedItem(null);
    };

    const getItemTotal = (item) => {
        const mainPrice = (parseFloat(item.basePrice) || 0) * (item.quantity || 1);
        const customVariantPrice = (parseFloat(item.customVariantPrice) || 0) * (item.quantity || 1);
        const addonPrice = Object.entries(item.addonCounts || {}).reduce(
            (sum, [_, { price, quantity }]) => sum + (parseFloat(price) || 0) * (quantity || 0),
            0
        );
        const comboPrice = (item.selectedCombos || []).reduce(
            (sum, combo) => sum + (parseFloat(combo.rate) || 0) * (combo.quantity || 1),
            0
        );
        return mainPrice + customVariantPrice + addonPrice + comboPrice;
    };

    const getSubTotal = () => cartItems.reduce((sum, item) => sum + getItemTotal(item), 0);

    const getTaxRate = () => taxRate !== null ? parseFloat(taxRate) : 0;

    const getTaxAmount = () => {
        const subTotal = getSubTotal();
        const taxRate = getTaxRate();
        return subTotal > 0 && taxRate > 0 ? (subTotal * taxRate) / 100 : 0;
    };

    const getGrandTotal = () => getSubTotal() + getTaxAmount();

    const handleCheckoutClick = () => setShowButtons(true);

    const handleQuantityChange = (item, value) => {
        const quantity = parseInt(value, 10);
        if (isNaN(quantity) || quantity < 1) {
            updateCartItem({ ...item, quantity: 1 });
        } else {
            updateCartItem({ ...item, quantity });
        }
    };

    const handleNavigation = () => {
        if (tableNumber) {
            navigate('/kitchen', { state: { tableNumber, customerName } });
        } else {
            alert("No table selected.");
        }
    };

    const handlePaymentSelection = async (method) => {
        const subTotal = getSubTotal();
        const grandTotal = getGrandTotal();
        const paymentDetails = {
            mode_of_payment: method,
            amount: grandTotal.toFixed(2),
        };
    
        const existingOrder = location.state?.existingOrder;
        const invoiceName = existingOrder?.name;
    
        if (!invoiceName) {
            alert("No existing draft invoice selected. Please save the order first.");
            return;
        }
    
        const payload = {
            name: invoiceName,
            payments: [{
                mode_of_payment: paymentDetails.mode_of_payment,
                amount: paymentDetails.amount,
            }],
            total: subTotal.toFixed(2),
            net_total: subTotal.toFixed(2),
            base_net_total: subTotal.toFixed(2),
            grand_total: grandTotal.toFixed(2),
            taxes_and_charges: taxTemplateName || "",
            customer: customerName || "CUST-2025-00001",
            contact_mobile: phoneNumber || watsappNumber || "",
            custom_table_number: tableNumber || "",
            custom_delivery_type: deliveryType || "DINE IN",
            customer_address: address || "",
            contact_email: email || "",
            custom_bearer: bearer || "",
            items: cartItems.flatMap((item) => {
                const variantPrice = parseFloat(item.customVariantPrice) || 0;
                const resolvedItemCode = resolveVariantItemCode(item.item_code, item.selectedSize);
    
                const mainItem = {
                    item_code: resolvedItemCode,
                    item_name: item.name,
                    qty: item.quantity || 1,
                    rate: (parseFloat(item.basePrice) || 0) + variantPrice,
                    amount: ((parseFloat(item.basePrice) || 0) + variantPrice) * (item.quantity || 1),
                    income_account: defaultIncomeAccount || "Sales - P",
                    custom_size_variants: item.selectedSize || "",
                    custom_other_variants: item.selectedCustomVariant || "",
                };
    
                const addonItems = Object.entries(item.addonCounts || {}).map(([addonName, { price, quantity }]) => ({
                    item_code: addonName,
                    item_name: addonName,
                    qty: quantity || 0,
                    rate: parseFloat(price) || 0,
                    amount: (parseFloat(price) || 0) * (quantity || 0),
                    income_account: defaultIncomeAccount || "Sales - P",
                }));
    
                const comboItems = (item.selectedCombos || []).map((combo) => {
                    const resolvedComboItemCode = resolveComboVariantItemCode(combo.name1, combo.selectedSize);
                    return {
                        item_code: resolvedComboItemCode,
                        item_name: combo.name1,
                        qty: combo.quantity || 1,
                        rate: parseFloat(combo.rate) || 0,
                        amount: (parseFloat(combo.rate) || 0) * (combo.quantity || 1),
                        income_account: defaultIncomeAccount || "Sales - P",
                        custom_size_variants: combo.selectedSize || "",
                        custom_other_variants: combo.selectedCustomVariant || "",
                    };
                });
    
                return [mainItem, ...addonItems, ...comboItems];
            }),
        };
    
        try {
            const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.update_pos_invoice", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                    "Expect": "",
                },
                body: JSON.stringify(payload),
            });
    
            const result = await response.json();
            if (response.ok && result.message?.status === "success") {
                if (method === "CASH") {
                    navigate("/cash", { state: { billDetails: result.message.data } });
                } else if (method === "CREDIT CARD") {
                    navigate("/card", { state: { billDetails: result.message.data } });
                } else if (method === "UPI") {
                    alert("Redirecting to UPI payment...");
                }
                setCartItems([]);
                alert(`Payment completed for Invoice ${invoiceName}. Status: ${result.message.data.status}`);
            } else {
                const errorMsg = result.message?.exception || result.message?.message || "Unknown error";
                alert(`Failed to process payment for POS Invoice: ${errorMsg}`);
            }
        } catch (error) {
            console.error("Error processing payment:", error);
            alert("Failed to process payment. Please try again.");
        }
    };
    const resolveVariantItemCode = (itemCode, selectedSize) => {
        const menuItem = allItems.find((m) => m.item_code === itemCode);
        if (!menuItem) return itemCode;
        if (menuItem.has_variants && selectedSize) {
            const variantItem = allItems.find((i) => i.item_code === `${menuItem.item_code}-${selectedSize}`);
            return variantItem ? variantItem.item_code : itemCode;
        }
        return itemCode;
    };
    
    const resolveComboVariantItemCode = (comboName, selectedSize) => {
        const comboItem = allItems.find((m) => m.item_name === comboName || m.item_code === comboName);
        if (!comboItem) return comboName;
        if (comboItem.has_variants && selectedSize) {
            const variantItem = allItems.find((i) => i.item_code === `${comboItem.item_code}-${selectedSize}`);
            return variantItem ? variantItem.item_code : comboItem.item_code;
        }
        return comboItem.item_code;
    };

    const saveOrder = async () => {
        const resolveVariantItemCode = (itemCode, selectedSize) => {
            const menuItem = allItems.find((m) => m.item_code === itemCode);
            if (!menuItem) return itemCode;
            if (menuItem.has_variants && selectedSize) {
                const variantItem = allItems.find((i) => i.item_code === `${menuItem.item_code}-${selectedSize}`);
                return variantItem ? variantItem.item_code : itemCode;
            }
            return itemCode;
        };
    
        const resolveComboVariantItemCode = (comboName, selectedSize) => {
            const comboItem = allItems.find((m) => m.item_name === comboName || m.item_code === comboName);
            if (!comboItem) return comboName;
            if (comboItem.has_variants && selectedSize) {
                const variantItem = allItems.find((i) => i.item_code === `${comboItem.item_code}-${selectedSize}`);
                return variantItem ? variantItem.item_code : comboItem.item_code;
            }
            return comboItem.item_code;
        };
    
        if (cartItems.length === 0) {
            alert("Cart is empty. Please add items before saving.");
            return;
        }
    
        if (deliveryType && deliveryType !== "DINE IN") {
            if (!address || address.trim() === "") {
                alert("Please enter a delivery address for this delivery type.");
                return;
            }
            if (!watsappNumber || watsappNumber.trim() === "") {
                alert("Please enter a WhatsApp number for this delivery type.");
                return;
            }
            if (!email || email.trim() === "") {
                alert("Please enter an email address for this delivery type.");
                return;
            }
        }
    
        const selectedCustomer = customers.find((c) => c.customer_name === customerName);
        const customerId = selectedCustomer ? selectedCustomer.name : "CUST-2025-00001";
    
        const allCartItems = cartItems.flatMap((item) => {
            const variantPrice = parseFloat(item.customVariantPrice) || 0;
            let resolvedItemCode = resolveVariantItemCode(item.item_code, item.selectedSize);
    
            const mainItem = {
                item_code: resolvedItemCode,
                item_name: item.name,
                qty: item.quantity || 1,
                rate: (parseFloat(item.basePrice) || 0) + variantPrice,
                amount: ((parseFloat(item.basePrice) || 0) + variantPrice) * (item.quantity || 1),
                income_account: defaultIncomeAccount || "Sales - P",
                custom_size_variants: item.selectedSize || "",
                custom_other_variants: item.selectedCustomVariant || "",
            };
    
            const addonItems = Object.entries(item.addonCounts || {}).map(([addonName, { price, quantity }]) => ({
                item_code: addonName,
                item_name: addonName,
                qty: quantity || 0,
                rate: parseFloat(price) || 0,
                amount: (parseFloat(price) || 0) * (quantity || 0),
                income_account: defaultIncomeAccount || "Sales - P",
            }));
    
            const comboItems = (item.selectedCombos || []).map((combo) => {
                const resolvedComboItemCode = resolveComboVariantItemCode(combo.name1, combo.selectedSize);
                return {
                    item_code: resolvedComboItemCode,
                    item_name: combo.name1,
                    qty: combo.quantity || 1,
                    rate: parseFloat(combo.rate) || 0,
                    amount: (parseFloat(combo.rate) || 0) * (combo.quantity || 1),
                    income_account: defaultIncomeAccount || "Sales - P",
                    custom_size_variants: combo.selectedSize || "",
                    custom_other_variants: combo.selectedCustomVariant || "",
                };
            });
    
            return [mainItem, ...addonItems, ...comboItems];
        });
    
        const subTotal = getSubTotal();
        const grandTotal = getGrandTotal();
        const existingOrder = location.state?.existingOrder;
    
        const payload = {
            customer: customerId,
            posting_date: new Date().toISOString().split("T")[0],
            due_date: new Date().toISOString().split("T")[0],
            is_pos: 1,
            company: company,
            currency: "INR",
            conversion_rate: 1,
            selling_price_list: "Standard Selling",
            price_list_currency: "INR",
            plc_conversion_rate: 1,
            total: subTotal.toFixed(2),
            net_total: subTotal.toFixed(2),
            base_net_total: subTotal.toFixed(2),
            taxes_and_charges: taxTemplateName || "",
            grand_total: grandTotal.toFixed(2),
            status: "Draft",
            custom_table_number: tableNumber || "",
            custom_delivery_type: deliveryType || "DINE IN",
            customer_address: address || "",
            contact_mobile: phoneNumber || watsappNumber || "",
            contact_email: email || "",
            custom_bearer: bearer || "",
            items: allCartItems,
        };
    
        if (existingOrder && existingOrder.name) {
            payload.name = existingOrder.name;
        }
    
        console.log("Saving payload:", JSON.stringify(payload, null, 2));
    
        try {
            const apiEndpoint = existingOrder && existingOrder.name
                ? "http://109.199.100.136:6060/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.update_pos_invoice_draft"
                : "http://109.199.100.136:6060/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.create_pos_invoice";
    
            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
                    "Expect": "",
                },
                body: JSON.stringify(payload),
            });
    
            const result = await response.json();
            console.log("Response from API:", result);
    
            if (response.ok && result.message && result.message.status === "success") {
                alert(`POS Invoice ${existingOrder ? "updated" : "saved"} as Draft! Grand Total: ₹${result.message.data.grand_total}`);
                setCartItems([]); // Clear cart after saving
                if (tableNumber && !existingOrder) {
                    setBookedTables(prev => [...new Set([...prev, tableNumber])]);
                }
                navigate("/table", { state: { savedInvoice: result.message.data } });
            } else {
                const errorMsg = result.message?.exception || result.message?.message || result.exception || result.message || "Unknown error";
                alert(`Failed to ${existingOrder ? "update" : "save"} POS Invoice: ${errorMsg}`);
        }
    } catch (error) {
        console.error(`Error ${existingOrder ? "updating" : "saving"} POS Invoice:`, error);
        alert("A network error occurred. Please check your connection and try again.");
    }
};

    const handleShow = () => setShowPaymentModal(true);
    const handleClose = () => setShowPaymentModal(false);

    const handlePayment = (method) => {
        handlePaymentSelection(method);
        handleClose();
    };

    const [customerInput, setCustomerInput] = useState("");
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_customers', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
                    },
                });
                const data = await response.json();
                let customerList = Array.isArray(data) ? data : (data.message || []);
                const formattedCustomers = customerList.map(customer => ({
                    name: customer.name,
                    customer_name: customer.customer_name || "",
                    mobile_no: customer.mobile_no || "",
                    primary_address: customer.primary_address || "",
                    email_id: customer.email_id || "",
                    custom_watsapp_no: customer.custom_watsapp_no || ""
                }));
                setCustomers(formattedCustomers);
                setFilteredCustomers(formattedCustomers);
            } catch (error) {
                console.error("Network error fetching customers:", error);
            }
        };
        fetchCustomers();
    }, []);

    const handleCustomerInputChange = (e) => {
        const value = e.target.value;
        setCustomerInput(value);
        setCustomerName(value);
        setShowCustomerSuggestions(true);

        if (value.trim() === "") {
            setFilteredCustomers(customers);
        } else {
            const filtered = customers.filter((customer) =>
                customer.customer_name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredCustomers(filtered);
        }
    };

    const handleCustomerSelect = (selectedCustomerName) => {
        const selectedCustomer = customers.find(
            (customer) => customer.customer_name.toLowerCase() === selectedCustomerName.toLowerCase()
        );
        if (selectedCustomer) {
            setCustomerInput(selectedCustomer.customer_name);
            setCustomerName(selectedCustomer.customer_name);
            setPhoneNumber(selectedCustomer.mobile_no);
            setAddress(selectedCustomer.primary_address);
            setEmail(selectedCustomer.email_id);
            setWatsappNumber(selectedCustomer.custom_watsapp_no); 
            setIsPhoneNumberSet(!!selectedCustomer.mobile_no);
        }
        setShowCustomerSuggestions(false);
    };

    const handleCustomerSubmit = async () => {
        const trimmedInput = customerInput.trim();
        if (!trimmedInput) {
            alert("Customer name is required.");
            return;
        }
    
        const customerExists = customers.some(
            (customer) => customer.customer_name.toLowerCase() === trimmedInput.toLowerCase()
        );
    
        if (!customerExists) {
            try {
                const customerData = {
                    customer_name: trimmedInput,
                    ...(phoneNumber && { phone: phoneNumber }),
                    ...(address && { address: address }),
                    ...(email && { email: email }),
                    ...(watsappNumber && { whatsapp_number: watsappNumber }),
                };
    
                const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.create_customer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
                    },
                    body: JSON.stringify(customerData),
                });
    
                const data = await response.json();
                if (data.status === "success") {
                    alert("Customer created successfully!");
                    const newCustomer = {
                        name: data.customer_id || trimmedInput,
                        customer_name: trimmedInput,
                        mobile_no: phoneNumber || "",
                        primary_address: address || "",
                        email_id: email || "",
                        custom_watsapp_no: watsappNumber || ""
                    };
                    setCustomers((prev) => [...prev, newCustomer]);
                    setFilteredCustomers((prev) => [...prev, newCustomer]);
                    setCustomerName(trimmedInput);
                } else {
                    alert(data.message || "Failed to create customer.");
                }
            } catch (error) {
                console.error("Error creating customer:", error);
                alert("Failed to create customer. Please try again.");
            }
        } else {
            handleCustomerSelect(trimmedInput);
        }
        setShowCustomerSuggestions(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleCustomerSubmit();
        }
    };

    const cancelCart = () => setCartItems([]);

    return (
        <>
            <div className="container-fluid">
                <div className="row">
                    <div className="col-lg-2 col-xl-1 category-sidebar">
                        <div className="row p-2">
                            {categories.map((category, index) => (
                                <div key={index} className="col-lg-12 mb-2">
                                    <button
                                        className={`category-btn w-100 rounded d-flex align-items-center justify-content-center ${selectedCategory === category ? 'active' : ''}`}
                                        onClick={() => handleFilter(category)}
                                    >
                                        <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="col-lg-5 col-xl-7 row2">
                        <div className="row" style={{ height: '90vh', overflowY: 'auto' }}>
                            {filteredItems.map((item, index) => (
                                <div className="col-xl-3 col-lg-6 col-md-4 col-6 align-items-center my-2" key={item.id}>
                                    <div className="card" onClick={() => handleItemClick(item)}>
                                        <div className='image-box'>
                                            <img src={item.image} alt={item.name} />
                                        </div>
                                        <div className="card-body p-2 mb-0 category-name">
                                            <h4 className="card-title text-center mb-0" style={{ fontSize: "14px" }}>{item.name}</h4>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <SavedOrder orders={savedOrders} setSavedOrders={setSavedOrders} menuItems={allItems} />
                    </div>

                    <div className="col-lg-5 col-xl-4 row1 px-4">
                        <div className="d-flex flex-column" style={{ height: '90vh' }}>
                            <div className="row p-2 mt-2 border shadow rounded flex-grow-1" style={{ overflowY: 'auto' }}>
                                <div className="col-12 p-2 p-md-2 mb-3">
                                    <div className="text-center row">
                                        <div className='row'>
                                            {tableNumber ? (
                                                <>
                                                    <div className='col-lg-2 text-start' style={{ position: "relative" }}>
                                                        <h1
                                                            className="display-4 fs-2"
                                                            style={{
                                                                background: tableNumber ? "rgb(58 56 56)" : "transparent",
                                                                color: tableNumber ? "white" : "inherit",
                                                                borderRadius: tableNumber ? "5px" : "0",
                                                                padding: tableNumber ? "4px 20px" : "0",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            }}
                                                        >
                                                            <small
                                                                style={{
                                                                    position: "absolute",
                                                                    top: "0px",
                                                                    left: "50%",
                                                                    transform: "translateX(-50%)",
                                                                    fontSize: "10px",
                                                                    color: "#fff",
                                                                }}
                                                            >
                                                                T.no
                                                            </small>
                                                            {tableNumber}
                                                        </h1>
                                                    </div>
                                                    <div className='col-10 col-lg-4 mb-2 position-relative'>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Enter Customer Name"
                                                            value={customerInput}
                                                            onChange={handleCustomerInputChange}
                                                            onKeyPress={handleKeyPress}
                                                            style={{
                                                                width: "100%",
                                                                padding: "10px",
                                                                border: "1px solid #ccc",
                                                                borderRadius: "5px",
                                                                fontSize: "1rem",
                                                            }}
                                                        />
                                                        {showCustomerSuggestions && filteredCustomers.length > 0 && (
                                                            <ul
                                                                className="customer-suggestions"
                                                                style={{
                                                                    position: "absolute",
                                                                    top: "100%",
                                                                    left: 0,
                                                                    width: "100%",
                                                                    maxHeight: "150px",
                                                                    overflowY: "auto",
                                                                    backgroundColor: "#fff",
                                                                    border: "1px solid #ccc",
                                                                    borderRadius: "5px",
                                                                    listStyleType: "none",
                                                                    padding: 0,
                                                                    margin: 0,
                                                                    zIndex: 1000,
                                                                }}
                                                            >
                                                                {filteredCustomers.map((customer, index) => (
                                                                    <li
                                                                        key={index}
                                                                        onClick={() => handleCustomerSelect(customer.customer_name)}
                                                                        style={{
                                                                            padding: "8px 12px",
                                                                            cursor: "pointer",
                                                                            borderBottom: "1px solid #eee",
                                                                        }}
                                                                        onMouseEnter={(e) => (e.target.style.backgroundColor = "#f0f0f0")}
                                                                        onMouseLeave={(e) => (e.target.style.backgroundColor = "#fff")}
                                                                    >
                                                                        {customer.customer_name}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                    <div className='col-2 col-lg-1 mb-2' style={{ background: "rgb(58 56 56)", color: "white", borderRadius: "5px", padding: "5px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <span
                                                            onClick={handleCustomerSubmit}
                                                            style={{ fontSize: "1.5rem", fontWeight: "bold", cursor: "pointer" }}
                                                        >
                                                            <i className="bi bi-check"></i>
                                                        </span>
                                                    </div>

                                                    {!isPhoneNumberSet ? (
                                                        <>
                                                            <div className='col-10 col-lg-4 mb-2'>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder="Enter phone number"
                                                                    value={phoneNumber}
                                                                    onChange={handlePhoneNumberChange}
                                                                    style={{ fontSize: "1rem", padding: "10px", width: "100%" }}
                                                                />
                                                            </div>
                                                            <div className='col-2 col-lg-1 mb-2' style={{ background: "rgb(58 56 56)", color: "white", borderRadius: "5px", padding: "5px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                <span
                                                                    onClick={handleSetPhoneNumber}
                                                                    style={{ fontWeight: "bold", cursor: "pointer" }}
                                                                >
                                                                    <i className="bi bi-send"></i>
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className='col-10 col-lg-5 mb-2 d-flex align-items-center'>
                                                            <p className="text-muted mb-0">Ph: {phoneNumber}</p>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <div className='col-10 col-lg-5 mb-2 position-relative'>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Enter Customer Name"
                                                            value={customerInput}
                                                            onChange={handleCustomerInputChange}
                                                            onKeyPress={handleKeyPress}
                                                            style={{
                                                                width: "100%",
                                                                padding: "10px",
                                                                border: "1px solid #ccc",
                                                                borderRadius: "5px",
                                                                fontSize: "1rem",
                                                            }}
                                                        />
                                                        {showCustomerSuggestions && filteredCustomers.length > 0 && (
                                                            <ul
                                                                className="customer-suggestions"
                                                                style={{
                                                                    position: "absolute",
                                                                    top: "100%",
                                                                    left: 0,
                                                                    width: "100%",
                                                                    maxHeight: "150px",
                                                                    overflowY: "auto",
                                                                    backgroundColor: "#fff",
                                                                    border: "1px solid #ccc",
                                                                    borderRadius: "5px",
                                                                    listStyleType: "none",
                                                                    padding: "0",
                                                                    margin: "0",
                                                                    zIndex: 1000,
                                                                }}
                                                            >
                                                                {filteredCustomers.map((customer, index) => (
                                                                    <li
                                                                        key={index}
                                                                        onClick={() => handleCustomerSelect(customer.customer_name)}
                                                                        style={{
                                                                            padding: "8px 12px",
                                                                            cursor: "pointer",
                                                                            borderBottom: "1px solid #eee",
                                                                        }}
                                                                        onMouseEnter={(e) => (e.target.style.backgroundColor = "#f0f0f0")}
                                                                        onMouseLeave={(e) => (e.target.style.backgroundColor = "#fff")}
                                                                    >
                                                                        {customer.customer_name}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                    <div className='col-2 col-lg-1 mb-2' style={{ background: "black", color: "white", borderRadius: "5px", padding: "5px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <span
                                                            onClick={handleCustomerSubmit}
                                                            style={{ fontSize: "1.5rem", fontWeight: "bold", cursor: "pointer" }}
                                                        >
                                                            <i className="bi bi-check"></i>
                                                        </span>
                                                    </div>

                                                    {!isPhoneNumberSet ? (
                                                        <>
                                                            <div className='col-10 col-lg-5 mb-2'>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder="Enter phone number"
                                                                    value={phoneNumber}
                                                                    onChange={handlePhoneNumberChange}
                                                                    style={{ fontSize: "1rem", padding: "10px", width: "100%" }}
                                                                />
                                                            </div>
                                                            <div className='col-2 col-lg-1 mb-2' style={{ background: "black", color: "white", borderRadius: "5px", padding: "5px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                <span
                                                                    onClick={handleSetPhoneNumber}
                                                                    style={{ fontWeight: "bold", cursor: "pointer" }}
                                                                >
                                                                    <i className="bi bi-send"></i>
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className='col-10 col-lg-5 mb-2 d-flex align-items-center'>
                                                            <p className="text-muted mb-0">Ph: {phoneNumber}</p>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {deliveryType && deliveryType !== "DINE IN" && (
                                                <>
                                                    <div className='col-12 mb-2'>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Enter delivery address"
                                                            value={address}
                                                            onChange={(e) => setAddress(e.target.value)}
                                                            style={{ fontSize: "1rem", padding: "10px", width: "100%" }}
                                                        />
                                                    </div>
                                                    <div className='col-12 mb-2'>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Enter WhatsApp number"
                                                            value={watsappNumber} 
                                                            onChange={(e) => setWatsappNumber(e.target.value)}
                                                            style={{ fontSize: "1rem", padding: "10px", width: "100%" }}
                                                        />
                                                    </div>
                                                    <div className='col-12 mb-2'>
                                                        <input
                                                            type="email"
                                                            className="form-control"
                                                            placeholder="Enter email"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            style={{ fontSize: "1rem", padding: "10px", width: "100%" }}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="table-responsive mt-3">
                                            <table className="table border text-start" style={{ fontSize: "13px" }}>
                                                <thead>
                                                    <tr>
                                                        <th>T.No.</th>
                                                        <th>Item Name</th>
                                                        <th>Qty</th>
                                                        <th>Price</th>
                                                        <th>Total</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {cartItems.map((item) => (
                                                        <tr key={item.cartItemId}>
                                                            <td>{tableNumber}</td>
                                                            <td>
                                                                {item.name}
                                                                {item.selectedSize && ` (${item.selectedSize})`}
                                                                {item.selectedCustomVariant && ` (${item.selectedCustomVariant})`}
                                                                {item.addonCounts && Object.keys(item.addonCounts).length > 0 && (
                                                                    <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#888" }}>
                                                                        {Object.entries(item.addonCounts).map(([addonName, { price, quantity }]) => (
                                                                            <li key={addonName}>
                                                                                + {addonName} x{quantity} (${(parseFloat(price) || 0).toFixed(2)})
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                                {item.selectedCombos && item.selectedCombos.length > 0 && (
                                                                    <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#555" }}>
                                                                        {item.selectedCombos.map((combo, idx) => (
                                                                            <li key={idx}>
                                                                                + {combo.name1} x{combo.quantity || 1}
                                                                                {(combo.selectedSize || combo.selectedCustomVariant) && (
                                                                                    ` (${[combo.selectedSize, combo.selectedCustomVariant].filter(Boolean).join(' - ')})`
                                                                                )}
                                                                                - ${(parseFloat(combo.rate) || 0).toFixed(2)}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    className="form-control form-control-sm"
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleQuantityChange(item, e.target.value)}
                                                                    min="1"
                                                                    style={{ width: "60px", padding: "2px", textAlign: "center" }}
                                                                />
                                                            </td>
                                                            <td>${(parseFloat(item.basePrice) || 0).toFixed(2)}</td>
                                                            <td>${getItemTotal(item).toFixed(2)}</td>
                                                            <td>
                                                                <button className="btn btn-sm" onClick={() => removeFromCart(item)}>
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row p-2 mt-2 border shadow rounded" style={{ flexShrink: 0 }}>
                                <div className="col-12">
                                    <div className="row">
                                        <div className="col-12 col-lg-6">
                                            <div className="row">
                                                <div className="col-md-6 mb-2 col-6 col-lg-12 col-xl-6">
                                                    <h5 className="mb-0" style={{ "fontSize": "11px" }}>Total Quantity</h5>
                                                    <div className='grand-tot-div justify-content-end'>
                                                        <span>{cartItems.reduce((total, item) => total + (item.quantity || 1), 0)}</span>
                                                    </div>
                                                </div>
                                                <div className="col-md-6 mb-2 col-6 col-lg-12 col-xl-6">
                                                    <h5 className="mb-0" style={{ "fontSize": "11px" }}>Subtotal</h5>
                                                    <div className='grand-tot-div'>
                                                        <span>$</span><span>{getSubTotal().toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                <div className="col-md-6 mb-2 col-6 col-lg-12 col-xl-6">
                                                    <h5 className="mb-0" style={{ "fontSize": "11px" }}>Tax</h5>
                                                    <div className='grand-tot-div justify-content-end'>
                                                        <span>${getTaxAmount().toFixed(2)} ({getTaxRate()}%)</span>
                                                    </div>
                                                </div>
                                                <div className="col-md-6 mb-2 col-6 col-lg-12 col-xl-6">
                                                    <h5 className="mb-0" style={{ "fontSize": "11px" }}>Grand Total</h5>
                                                    <div className='grand-tot-div justify-content-end'>
                                                        <span>${getGrandTotal().toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-12 col-lg-6">
                                            <div className="row mt-3">
                                                <div className="col-md-6 mb-2 col-6 col-lg-12 col-xl-6">
                                                    <button
                                                        type="button"
                                                        className="btn w-100"
                                                        onClick={saveOrder}
                                                        style={{
                                                            padding: "10px 12px",
                                                            backgroundColor: "#white",
                                                            color: "black",
                                                            border: "1px solid #3498db",
                                                            borderRadius: "5px",
                                                            fontWeight: "bold",
                                                            cursor: "pointer",
                                                            fontSize: "10px",
                                                        }}
                                                    >
                                                        Save/New
                                                    </button>
                                                </div>
                                                <div className="col-md-6 mb-2 col-6 col-lg-12 col-xl-6">
                                                    <button
                                                        type="button"
                                                        className="btn w-100"
                                                        onClick={() => setShowBillModal(true)}
                                                        style={{
                                                            padding: "10px 12px",
                                                            background: "white",
                                                            color: "black",
                                                            border: "1px solid #3498db",
                                                            borderRadius: "5px",
                                                            fontWeight: "bold",
                                                            cursor: "pointer",
                                                            fontSize: "10px"
                                                        }}
                                                    >
                                                        Print
                                                    </button>
                                                </div>

                                                {showBillModal && (
                                                    <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                                                        <div className="modal-dialog modal-lg">
                                                            <div className="modal-content">
                                                                <div className="modal-header">
                                                                    <h4 className="modal-title">Invoice / Bill</h4>
                                                                    <button className="btn-close" onClick={() => setShowBillModal(false)}></button>
                                                                </div>
                                                                <div className="modal-body">
                                                                    <div className="bill-section border p-3 shadow rounded">
                                                                        <div className="d-flex justify-content-between">
                                                                            <p><strong>{tableNumber ? "Table No" : "Delivery Type"}:</strong> {tableNumber || deliveryType}</p>
                                                                            <p><strong>Customer:</strong> {customerName}</p>
                                                                        </div>
                                                                        {deliveryType !== "DINE IN" && (
                                                                            <div className="mt-2">
                                                                                <p><strong>Address:</strong> {address || "N/A"}</p>
                                                                                <p><strong>WhatsApp:</strong> {watsappNumber || "N/A"}</p>
                                                                                <p><strong>Email:</strong> {email || "N/A"}</p>
                                                                            </div>
                                                                        )}
                                                                        <table className="table border text-start mt-2">
                                                                            <thead>
                                                                                <tr>
                                                                                    <th>Item</th>
                                                                                    <th>Qty</th>
                                                                                    <th>Rate</th>
                                                                                    <th>Total</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {cartItems.map((item) => (
                                                                                    <tr key={`${item.item_code}-${JSON.stringify(item.selectedCombos || [])}`}>
                                                                                        <td>
                                                                                            {item.name}
                                                                                            {item.selectedSize && ` (${item.selectedSize})`}
                                                                                            {item.selectedCustomVariant && ` (${item.selectedCustomVariant})`}
                                                                                            {item.addonCounts && Object.keys(item.addonCounts).length > 0 && (
                                                                                                <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#888" }}>
                                                                                                    {Object.entries(item.addonCounts).map(([addonName, { price, quantity }]) => (
                                                                                                        <li key={addonName}>+ {addonName} x{quantity} (${(parseFloat(price) || 0).toFixed(2)})</li>
                                                                                                    ))}
                                                                                                </ul>
                                                                                            )}
                                                                                            {item.selectedCombos && item.selectedCombos.length > 0 && (
                                                                                                <ul style={{ listStyleType: "none", padding: 0, marginTop: "5px", fontSize: "12px", color: "#555" }}>
                                                                                                    {item.selectedCombos.map((combo, idx) => (
                                                                                                        <li key={idx}>
                                                                                                            + {combo.name1} x{combo.quantity || 1}
                                                                                                            {(combo.selectedSize || combo.selectedCustomVariant) && (
                                                                                                                ` (${[combo.selectedSize, combo.selectedCustomVariant].filter(Boolean).join(' - ')})`
                                                                                                            )}
                                                                                                            - ${(parseFloat(combo.rate) || 0).toFixed(2)}
                                                                                                        </li>
                                                                                                    ))}
                                                                                                </ul>
                                                                                            )}
                                                                                        </td>
                                                                                        <td>{item.quantity || 1}</td>
                                                                                        <td>${(parseFloat(item.basePrice) || 0).toFixed(2)}</td>
                                                                                        <td>${getItemTotal(item).toFixed(2)}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                        <div className="row mt-3">
                                                                            <div className="col-6 text-start"><strong>Total Quantity:</strong></div>
                                                                            <div className="col-6 text-end">{cartItems.reduce((total, item) => total + (item.quantity || 1), 0)}</div>
                                                                            <div className="col-6 text-start"><strong>Subtotal:</strong></div>
                                                                            <div className="col-6 text-end">${getSubTotal().toFixed(2)}</div>
                                                                            <div className="col-6 text-start"><strong>VAT ({getTaxRate()}%):</strong></div>
                                                                            <div className="col-6 text-end">${getTaxAmount().toFixed(2)}</div>
                                                                            <div className="col-6 text-start"><strong>Grand Total:</strong></div>
                                                                            <div className="col-6 text-end"><strong>${getGrandTotal().toFixed(2)}</strong></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="modal-footer">
                                                                    <button className="btn btn-secondary" onClick={() => setShowBillModal(false)}>Close</button>
                                                                    <button className="btn btn-dark" onClick={() => window.print()}>
                                                                        <i className="bi bi-printer"></i> Print Bill
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="col-md-6 mb-2 col-6 mt-1 col-lg-12 col-xl-6">
                                                    <button
                                                        type="button"
                                                        className="btn w-100"
                                                        onClick={cancelCart}
                                                        style={{
                                                            padding: "10px 12px",
                                                            backgroundColor: "#3498db",
                                                            color: "white",
                                                            border: "none",
                                                            borderRadius: "5px",
                                                            fontWeight: "bold",
                                                            cursor: "pointer",
                                                            fontSize: "10px"
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                                <div className="col-md-6 mb-2 col-6 mt-1 col-lg-12 col-xl-6">
                                                    <button
                                                        type="button"
                                                        className="btn w-100"
                                                        onClick={() => {
                                                            handleCheckoutClick();
                                                            handleShow();
                                                        }}
                                                        style={{ padding: "10px 12px", fontSize: "10px", fontWeight: "bold", background: "#3498db", color: "white" }}
                                                    >
                                                        Pay
                                                    </button>
                                                </div>
                                            </div>

                                            <Modal show={showPaymentModal} onHide={handleClose} centered>
                                                <Modal.Header closeButton>
                                                    <Modal.Title>Select Payment Method</Modal.Title>
                                                </Modal.Header>
                                                <Modal.Body>
                                                    <div className="row">
                                                        <div className="col-4">
                                                            <Button variant="primary" className="w-100" onClick={() => handlePayment("CASH")}>
                                                                CASH
                                                            </Button>
                                                        </div>
                                                        <div className="col-4">
                                                            <Button variant="secondary" className="w-100" onClick={() => handlePayment("CREDIT CARD")}>
                                                                CARD
                                                            </Button>
                                                        </div>
                                                        <div className="col-4">
                                                            <Button variant="warning" className="w-100" onClick={() => handlePayment("UPI")}>
                                                                UPI
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Modal.Body>
                                                <Modal.Footer>
                                                    <Button variant="danger" onClick={handleClose}>
                                                        Cancel
                                                    </Button>
                                                </Modal.Footer>
                                            </Modal>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {selectedItem && (
                    <FoodDetails
                        item={selectedItem}
                        allItems={allItems}
                        onClose={() => setSelectedItem(null)}
                        onUpdate={handleItemUpdate}
                    />
                )}
            </div>
        </>
    );
}

export default Front;