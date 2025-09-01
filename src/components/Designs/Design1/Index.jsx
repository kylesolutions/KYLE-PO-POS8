import React, { useState } from 'react';
import { Search, Filter, Plus, Minus, Home, Grid3X3, ShoppingCart, Clock, Settings } from 'lucide-react';


const CategoryTabs = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="category-tabs">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`category-tab ${activeCategory === category ? 'active' : ''}`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

const MenuCard = ({ id, name, price, image, bowlsAvailable, quantity, onQuantityChange }) => {
  const handleIncrement = () => {
    onQuantityChange(id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      onQuantityChange(id, quantity - 1);
    }
  };

  return (
    <div className="menu-card">
      <div className="menu-card-image">
        <img src={image} alt={name} />
      </div>
      <h3 className="menu-card-title">{name}</h3>
      <p className="menu-card-availability">{bowlsAvailable} bowl's available</p>
      <div className="menu-card-footer">
        <span className="menu-card-price">${price.toFixed(2)}</span>
        <div className="menu-card-controls">
          <button
            className={`control-button ${quantity === 0 ? 'disabled' : ''}`}
            onClick={handleDecrement}
            disabled={quantity === 0}
          >
            <Minus className="control-icon" />
          </button>
          <span className="quantity">{quantity}</span>
          <button className="control-button add" onClick={handleIncrement}>
            <Plus className="control-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderItem = ({ name, quantity, note, price }) => {
  return (
    <div className="order-item">
      <div className="order-item-image"></div>
      <div className="order-item-details">
        <div className="order-item-header">
          <h4 className="order-item-title">{name}</h4>
          <button className="edit-button">
            <svg className="edit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
        </div>
        <div className="order-item-info">
          <span>x{quantity}</span>
          {note && <span>Note: {note}</span>}
        </div>
        <div className="order-item-price">${price.toFixed(2)}</div>
      </div>
    </div>
  );
};

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Menu');
  const [quantities, setQuantities] = useState({});
  const [orderType, setOrderType] = useState('dine-in');

  const categories = [
    'All Menu',
    'Promotion',
    'Main Courses',
    'Beverages',
    'Cake',
    'Appetizers',
    'Dessert',
  ];

  const menuItems = [
    {
      id: '1',
      name: 'Fresh Basil Salad',
      price: 1.57,
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop&crop=center',
      bowlsAvailable: 18,
      category: 'All Menu',
    },
    {
      id: '2',
      name: 'Salad with Berries',
      price: 2.00,
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop&crop=center',
      bowlsAvailable: 18,
      category: 'All Menu',
    },
    {
      id: '3',
      name: 'Green Linguine Noodles',
      price: 2.82,
      image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=400&fit=crop&crop=center',
      bowlsAvailable: 18,
      category: 'Main Courses',
    },
    {
      id: '4',
      name: 'Lumpiang Sariwa',
      price: 2.65,
      image: 'https://images.unsplash.com/photo-1563379091339-03246963d293?w=400&h=400&fit=crop&crop=center',
      bowlsAvailable: 18,
      category: 'Appetizers',
    },
    {
      id: '5',
      name: 'Curry Garlic Noodles',
      price: 3.62,
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop&crop=center',
      bowlsAvailable: 18,
      category: 'Main Courses',
    },
    {
      id: '6',
      name: 'Sunrise Sirloin Specia',
      price: 3.20,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop&crop=center',
      bowlsAvailable: 18,
      category: 'Main Courses',
    },
  ];

  const currentOrder = [
    {
      id: '1',
      name: 'Fresh Basil Salad',
      quantity: 2,
      note: 'Spicy Lv.5',
      price: 3.14,
    },
    {
      id: '5',
      name: 'Curry Garlic Noodles',
      quantity: 1,
      price: 3.62,
    },
    {
      id: '3',
      name: 'Green Linguine Noodles',
      quantity: 2,
      note: 'Spicy Lv.3',
      price: 5.64,
    },
  ];

  const handleQuantityChange = (id, newQuantity) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: newQuantity,
    }));
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All Menu' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const subtotal = 12.4;
  const tax = 2;
  const total = 14.44;

  return (
    <div className="container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <span>R</span>
        </div>
        <div className="sidebar-nav">
          <button className="nav-button">
            <Home className="nav-icon" />
          </button>
          <button className="nav-button active">
            <Grid3X3 className="nav-icon" />
          </button>
          <button className="nav-button">
            <ShoppingCart className="nav-icon" />
          </button>
          <button className="nav-button">
            <Clock className="nav-icon" />
          </button>
          <button className="nav-button">
            <Settings className="nav-icon" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Menu Section */}
        <div className="menu-section">
          {/* Header */}
          <div className="header">
            <div className="header-left">
              <div className="search-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search menu here..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <button className="filter-button">
                <Filter className="filter-icon" />
                Filter
              </button>
            </div>
            <div className="header-right">
              <button className="note-button">
                <Plus className="note-icon" />
                Create a Note
              </button>
              <div className="user-info">
                <div className="user-avatar"></div>
                <div>
                  <div className="user-name">Brooklyn</div>
                  <div className="user-role">Cashier</div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          {/* Menu Grid */}
          <div className="menu-grid">
            {filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                id={item.id}
                name={item.name}
                price={item.price}
                image={item.image}
                bowlsAvailable={item.bowlsAvailable}
                quantity={quantities[item.id] || 0}
                onQuantityChange={handleQuantityChange}
              />
            ))}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="order-summary">
          {/* Order Header */}
          <div className="order-header">
            <div>
              <h2 className="order-title">Current Orders</h2>
              <div className="order-number">#569124</div>
            </div>
            <div className="table-info">
              <div className="table-label">No.Table</div>
              <div className="table-number">25</div>
            </div>
          </div>

          {/* Order Type */}
          <div className="order-type">
            <button
              onClick={() => setOrderType('dine-in')}
              className={`type-button ${orderType === 'dine-in' ? 'active' : ''}`}
            >
              Dine In
            </button>
            <button
              onClick={() => setOrderType('take-away')}
              className={`type-button ${orderType === 'take-away' ? 'active' : ''}`}
            >
              Take Away
            </button>
          </div>

          {/* Order Items */}
          <div className="order-items">
            {currentOrder.map((item) => (
              <OrderItem
                key={item.id}
                name={item.name}
                quantity={item.quantity}
                note={item.note}
                price={item.price}
              />
            ))}
          </div>

          {/* Payment Summary */}
          <div className="payment-summary">
            <h3 className="payment-title">Payment Summary</h3>
            <div className="payment-details">
              <div className="payment-row">
                <span className="payment-label">Sub Total</span>
                <span className="payment-value">${subtotal.toFixed(2)}</span>
              </div>
              <div className="payment-row">
                <span className="payment-label">Tax</span>
                <span className="payment-value">${tax.toFixed(2)}</span>
              </div>
              <div className="payment-divider"></div>
              <div className="payment-row">
                <span className="payment-total-label">Total Payment</span>
                <span className="payment-total-value">${total.toFixed(2)}</span>
              </div>
            </div>
            <button className="place-order-button">Place Order</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;