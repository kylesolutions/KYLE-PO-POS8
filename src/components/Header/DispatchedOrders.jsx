import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Package, 
  CreditCard, 
  RefreshCw, 
  ArrowLeft,
  Users,
  Home,
  Truck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import './DispatchedOrders.css';

function DispatchedOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [refreshing, setRefreshing] = useState(false);
    const navigate = useNavigate();

    const fetchDispatchedOrders = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Step 1: Fetch all kitchen notes
            const kitchenResponse = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_kitchen_notes', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
                },
            });

            if (!kitchenResponse.ok) {
                const responseText = await kitchenResponse.text();
                console.error('Fetch kitchen notes failed:', {
                    status: kitchenResponse.status,
                    statusText: kitchenResponse.statusText,
                    responseText,
                });
                throw new Error(`Failed to fetch kitchen notes: ${kitchenResponse.status} - ${kitchenResponse.statusText}`);
            }

            let kitchenResult;
            try {
                kitchenResult = await kitchenResponse.json();
            } catch (jsonError) {
                console.error('Error parsing kitchen notes JSON response:', jsonError);
                throw new Error('Invalid response format from server: Unable to parse JSON');
            }

            console.log('DispatchedOrders.jsx: Raw response from get_kitchen_notes:', JSON.stringify(kitchenResult, null, 2));

            if (!kitchenResult.message || kitchenResult.message.status !== 'success') {
                throw new Error(kitchenResult.message?.message || 'Failed to fetch kitchen notes: Invalid response status');
            }

            if (!Array.isArray(kitchenResult.message.data)) {
                throw new Error('Invalid response format: Expected kitchen notes data to be an array');
            }

            const allKitchenOrders = kitchenResult.message.data;

            // Step 2: Fetch POS invoices to get custom_chair_numbers
            const posResponse = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoices', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
                },
            });

            if (!posResponse.ok) {
                const responseText = await posResponse.text();
                console.error('Fetch POS invoices failed:', {
                    status: posResponse.status,
                    statusText: posResponse.statusText,
                    responseText,
                });
                throw new Error(`Failed to fetch POS invoices: ${posResponse.status} - ${posResponse.statusText}`);
            }

            let posResult;
            try {
                posResult = await posResponse.json();
            } catch (jsonError) {
                console.error('Error parsing POS invoices JSON response:', jsonError);
                throw new Error('Invalid response format from server: Unable to parse JSON');
            }

            console.log('DispatchedOrders.jsx: Raw response from get_pos_invoices:', JSON.stringify(posResult, null, 2));

            if (!posResult.message || posResult.message.status !== 'success') {
                throw new Error(posResult.message?.message || 'Failed to fetch POS invoices: Invalid response status');
            }

            if (!Array.isArray(posResult.message.data)) {
                throw new Error('Invalid response format: Expected POS invoices data to be an array');
            }

            const posInvoices = posResult.message.data;

            // Step 3: Map kitchen orders and enrich with custom_chair_numbers from POS invoices
            const dispatchedOrders = allKitchenOrders
                .map(kitchenOrder => {
                    // Skip orders with delivery_type = "DELIVERY"
                    if (kitchenOrder.delivery_type === "DELIVERY") {
                        return null;
                    }

                    const dispatchedItems = kitchenOrder.items.filter(item => item.status === 'Dispatched');
                    if (dispatchedItems.length === 0) return null;

                    const posInvoice = posInvoices.find(invoice => invoice.name === kitchenOrder.pos_invoice_id);

                    const chairNumbers = posInvoice?.custom_chair_numbers
                        ? Array.isArray(posInvoice.custom_chair_numbers)
                            ? posInvoice.custom_chair_numbers.map(num => parseInt(num))
                            : posInvoice.custom_chair_numbers.split(",").map(num => parseInt(num.trim()))
                        : [];

                    return {
                        name: kitchenOrder.pos_invoice_id,
                        customer: kitchenOrder.customer_name || "One Time Customer",
                        custom_table_number: kitchenOrder.table_number || "",
                        custom_delivery_type: kitchenOrder.delivery_type || "DINE IN",
                        custom_chair_count: parseInt(kitchenOrder.number_of_chair) || 0,
                        custom_chair_numbers: chairNumbers,
                        contact_mobile: posInvoice?.contact_mobile || "",
                        customer_address: posInvoice?.customer_address || "",
                        contact_email: posInvoice?.contact_email || "",
                        posting_date: kitchenOrder.order_time ? kitchenOrder.order_time.split(" ")[0] : "",
                        posting_time: kitchenOrder.order_time ? kitchenOrder.order_time.split(" ")[1] : "",
                        apply_discount_on: posInvoice?.apply_discount_on || "Grand Total",
                        additional_discount_percentage: parseFloat(posInvoice?.additional_discount_percentage) || 0,
                        discount_amount: parseFloat(posInvoice?.discount_amount) || 0,
                        dispatchedItems: dispatchedItems.map(item => {
                            let selectedSize = "";
                            let selectedCustomVariant = "";
                            if (item.custom_variants) {
                                const variants = item.custom_variants.split(" - ");
                                selectedSize = variants[0] || "";
                                selectedCustomVariant = variants[1] || "";
                            }

                            const posItem = posInvoice?.items?.find(i => i.item_name === item.item_name && i.custom_size_variants === selectedSize);
                            const itemCode = posItem?.item_code || item.item_name;

                            const isCombo = posInvoice?.items?.some(i => i.item_name === item.item_name && i.custom_size_variants && i.item_code !== item.item_name);

                            return {
                                item_code: itemCode,
                                name: item.item_name,
                                description: item.customer_description || "",
                                basePrice: parseFloat(item.price) || 0,
                                quantity: parseInt(item.quantity, 10) || 1,
                                selectedSize: selectedSize,
                                selectedCustomVariant: selectedCustomVariant,
                                kitchen: item.kitchen || "Unknown",
                                addonCounts: {},
                                selectedCombos: isCombo ? [{
                                    name1: item.item_name,
                                    selectedSize: selectedSize,
                                    selectedCustomVariant: selectedCustomVariant,
                                    custom_customer_description: item.customer_description || "",
                                    quantity: parseInt(item.quantity, 10) || 1,
                                    rate: parseFloat(item.price) || 0,
                                    kitchen: item.kitchen || "Unknown",
                                    ingredients: item.ingredients || [],
                                    status: item.status || "Not Dispatched"
                                }] : [],
                                ingredients: item.ingredients || [],
                            };
                        }),
                    };
                })
                .filter(order => order !== null);

            setOrders(dispatchedOrders);
            console.log("DispatchedOrders.jsx: Formatted dispatched orders:", JSON.stringify(dispatchedOrders, null, 2));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('DispatchedOrders.jsx: Error fetching dispatched orders:', error);
            setError(`Failed to load dispatched orders: ${errorMessage}. Please try again or contact support.`);
            setOrders([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleMarkPaid = async (invoiceId) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.mark_pos_invoice_paid', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    mode_of_payment: "Cash" // Adjust as needed, could be dynamic
                }),
            });

            if (!response.ok) {
                const responseText = await response.text();
                console.error('mark_pos_invoice_paid failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    responseText,
                });
                throw new Error(`Failed to mark POS Invoice as Paid: ${response.status} - ${response.statusText}`);
            }

            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                console.error('Error parsing mark_pos_invoice_paid JSON response:', jsonError);
                throw new Error('Invalid response format from server: Unable to parse JSON');
            }

            console.log('DispatchedOrders.jsx: mark_pos_invoice_paid Response:', JSON.stringify(result, null, 2));

            if (result.message.status !== 'success') {
                throw new Error(result.message.message || 'Failed to mark POS Invoice as Paid');
            }

            alert(`POS Invoice ${invoiceId} marked as Paid successfully!`);
            // Refresh orders after marking as paid
            await fetchDispatchedOrders();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('DispatchedOrders.jsx: Error marking POS Invoice as Paid:', error);
            setError(`Failed to mark POS Invoice as Paid: ${errorMessage}`);
            alert(`Failed to mark POS Invoice as Paid: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDispatchedOrders();
        const intervalId = setInterval(() => fetchDispatchedOrders(true), 30000);
        return () => clearInterval(intervalId);
    }, []);

    const handleSelectOrder = (order) => {
        const formattedCartItems = order.dispatchedItems.map((item) => ({
            cartItemId: uuidv4(),
            id: item.item_code,
            item_code: item.item_code,
            name: item.name,
            custom_customer_description: item.description || "",
            basePrice: item.basePrice || 0,
            quantity: item.quantity || 1,
            selectedSize: item.selectedSize || "",
            selectedCustomVariant: item.selectedCustomVariant || "",
            addonCounts: item.addonCounts || {},
            selectedCombos: item.selectedCombos || [],
            kitchen: item.kitchen || "Unknown",
            ingredients: item.ingredients || [],
            status: "Dispatched"
        }));

        console.log("DispatchedOrders.jsx: Formatted cart items for Front:", JSON.stringify(formattedCartItems, null, 2));

        navigate('/frontpage', {
            state: {
                tableNumber: order.custom_table_number || "",
                deliveryType: order.custom_delivery_type || "DINE IN",
                chairCount: order.custom_chair_count || 0,
                chairNumbers: order.custom_chair_numbers || [],
                customer: order.customer || "",
                customer_name: order.customer || "One Time Customer",
                customer_phone: order.contact_mobile || "",
                address: order.customer_address || "",
                email: order.contact_email || "",
                watsappNumber: order.contact_mobile || "",
                existingOrder: {
                    ...order,
                    items: order.dispatchedItems.map((item) => ({
                        item_code: item.item_code,
                        item_name: item.name,
                        custom_customer_description: item.description || "",
                        rate: item.basePrice || 0,
                        qty: item.quantity || 1,
                        custom_size_variants: item.selectedSize || "",
                        custom_other_variants: item.selectedCustomVariant || "",
                        custom_kitchen: item.kitchen || "Unknown",
                        ingredients: item.ingredients || [],
                        status: "Dispatched"
                    })),
                    apply_discount_on: order.apply_discount_on,
                    additional_discount_percentage: order.additional_discount_percentage,
                    discount_amount: order.discount_amount,
                    custom_chair_count: order.custom_chair_count,
                    custom_chair_numbers: order.custom_chair_numbers,
                },
                dispatchedItems: order.dispatchedItems,
            },
        });
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleRefresh = () => {
        fetchDispatchedOrders(true);
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.custom_table_number.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filterType === 'ALL' || order.custom_delivery_type === filterType;
        
        return matchesSearch && matchesFilter;
    });

    const getDeliveryIcon = (type) => {
        switch (type) {
            case 'DINE IN':
                return <Home className="delivery-icon dine-in" />;
            case 'DELIVERY':
                return <Truck className="delivery-icon delivery" />;
            default:
                return <Package className="delivery-icon" />;
        }
    };

    const calculateOrderTotal = (items) => {
        return items.reduce((total, item) => total + (item.basePrice * item.quantity), 0);
    };

    return (
        <div className="dispatched-orders-container">
            <div className="dispatched-header">
                <button className="back-button" onClick={handleBack}>
                    <ArrowLeft size={20} />
                    Back
                </button>
                <h1 className="header-title">Dispatched Orders</h1>
                <div className="header-actions">
                    <button 
                        className={`refresh-button ${refreshing ? 'refreshing' : ''}`} 
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            <div className="dispatched-content">
                {loading && !refreshing ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">Loading dispatched orders...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <AlertCircle className="error-icon" size={48} />
                        <p className="error-message">{error}</p>
                        <button className="retry-button" onClick={() => fetchDispatchedOrders()}>
                            Try Again
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="controls-section">
                            <div className="search-section">
                                <div className="search-input-container">
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="Search by customer, invoice ID, or table..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div className="filter-section">
                                <select
                                    className="filter-select"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="ALL">All Orders</option>
                                    <option value="DINE IN">Dine In</option>
                                    <option value="TAKEAWAY">Takeaway</option>
                                </select>
                            </div>

                            <div className="stats-section">
                                <div className="stat-item">
                                    <span className="stat-number">{filteredOrders.length}</span>
                                    <span className="stat-label">Orders</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">
                                        {filteredOrders.reduce((sum, order) => sum + order.dispatchedItems.length, 0)}
                                    </span>
                                    <span className="stat-label">Items</span>
                                </div>
                            </div>
                        </div>

                        {filteredOrders.length === 0 ? (
                            <div className="empty-state">
                                <Package className="empty-icon" size={64} />
                                <h3>No Dispatched Orders</h3>
                                <p>No orders match your current search and filter criteria.</p>
                            </div>
                        ) : (
                            <div className="orders-grid">
                                {filteredOrders.map((order, index) => (
                                    <div key={order.name} className="order-card">
                                        <div className="order-card-header">
                                            <div className="order-info">
                                                <div className="order-number">#{index + 1}</div>
                                                <div className="invoice-id">{order.name}</div>
                                                <div className="delivery-type">
                                                    {getDeliveryIcon(order.custom_delivery_type)}
                                                    <span>{order.custom_delivery_type}</span>
                                                </div>
                                            </div>
                                            <div className="order-status">
                                                <CheckCircle className="status-icon dispatched" size={20} />
                                                <span>Dispatched</span>
                                            </div>
                                        </div>

                                        <div className="customer-info">
                                            <div className="info-row">
                                                <User size={16} />
                                                <span>{order.customer}</span>
                                            </div>
                                            {order.custom_table_number && (
                                                <div className="info-row">
                                                    <MapPin size={16} />
                                                    <span>Table {order.custom_table_number}</span>
                                                    {order.custom_delivery_type === "DINE IN" && order.custom_chair_count > 0 && (
                                                        <span className="chair-count">
                                                            <Users size={14} />
                                                            {order.custom_chair_count} chairs
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {order.contact_mobile && (
                                                <div className="info-row">
                                                    <Phone size={16} />
                                                    <span>{order.contact_mobile}</span>
                                                </div>
                                            )}
                                            {order.contact_email && (
                                                <div className="info-row">
                                                    <Mail size={16} />
                                                    <span>{order.contact_email}</span>
                                                </div>
                                            )}
                                            {order.customer_address && (
                                                <div className="info-row">
                                                    <MapPin size={16} />
                                                    <span>{order.customer_address}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="items-section">
                                            <h4 className="items-title">
                                                <Package size={16} />
                                                Items ({order.dispatchedItems.length})
                                            </h4>
                                            <div className="items-list">
                                                {order.dispatchedItems.map((item, i) => (
                                                    <div key={i} className="item-card">
                                                        <div className="item-header">
                                                            <span className="item-name">{item.name}</span>
                                                            <span className="item-price">
                                                                د.إ{(item.basePrice * item.quantity).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className="item-details">
                                                            {item.selectedSize && (
                                                                <span className="item-variant">Size: {item.selectedSize}</span>
                                                            )}
                                                            {item.selectedCustomVariant && (
                                                                <span className="item-variant">Variant: {item.selectedCustomVariant}</span>
                                                            )}
                                                            <span className="item-quantity">Qty: {item.quantity}</span>
                                                        </div>
                                                        {item.description && (
                                                            <div className="item-note">
                                                                <strong>Note:</strong> {item.description}
                                                            </div>
                                                        )}
                                                        {item.ingredients?.length > 0 && (
                                                            <div className="item-ingredients">
                                                                <strong>Ingredients:</strong>{" "}
                                                                {item.ingredients
                                                                    .map(ing => `${ing.name} - ${ing.quantity} ${ing.unit}`)
                                                                    .join(", ")}
                                                            </div>
                                                        )}
                                                        {item.addonCounts && Object.keys(item.addonCounts).length > 0 && (
                                                            <div className="item-addons">
                                                                {Object.entries(item.addonCounts).map(
                                                                    ([addonName, { price, quantity }]) => (
                                                                        <div key={addonName} className="addon-item">
                                                                            + {addonName} x{quantity} (د.إ{(price * quantity).toFixed(2)})
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="order-footer">
                                            <div className="order-meta">
                                                <div className="timestamp">
                                                    <Clock size={16} />
                                                    <span>{order.posting_date} {order.posting_time}</span>
                                                </div>
                                                <div className="total-amount">
                                                    <strong>Total: د.إ{calculateOrderTotal(order.dispatchedItems).toFixed(2)}</strong>
                                                </div>
                                            </div>
                                            <div className="order-actions">
                                                <button
                                                    className="select-button"
                                                    onClick={() => handleSelectOrder(order)}
                                                >
                                                    <CreditCard size={16} />
                                                    Select for Billing
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default DispatchedOrders;