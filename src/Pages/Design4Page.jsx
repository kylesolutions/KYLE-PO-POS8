import React, { useState } from 'react'
import Design4Nav from '../components/Designs/Design4/Design4Nav';
import Design4Headers from '../components/Designs/Design4/Design4Headers';
import Design4Cart from '../components/Designs/Design4/Design4Cart';
import Design4FoodDetails from '../components/Designs/Design4/Design4FoodDetails';

function Design4Page() {
    const [selectedItem, setSelectedItem] = useState(null);
    const [cartItems, setCartItems] = useState([]);

    const addToCart = (itemToAdd) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === itemToAdd.id);
            if (existingItem) {
                return prevItems.map(item =>
                    item.id === itemToAdd.id
                        ? { ...item, quantity: item.quantity + itemToAdd.quantity }
                        : item
                );
            } else {
                return [...prevItems, itemToAdd];
            }
        });
    };

    const updateQuantity = (itemId, newQuantity) => {
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, quantity: Math.max(1, newQuantity) } : item
            )
        );
    };
  return (
    <div className='container-fluid'>
            <div className='row'>
                <div className='col-1'>
                    <Design4Nav/>
                </div>
                <div className='col-8' style={{ height: '97vh', overflowY: 'auto' }}>
                    <Design4FoodDetails selectedItem={selectedItem} addToCart={addToCart}/>
                    <Design4Headers  setSelectedItem={setSelectedItem}/>
                </div>
                <div className='col-3'>
                    <Design4Cart cartItems={cartItems} updateQuantity={updateQuantity} />
                </div>
            </div>
        </div>
  )
}

export default Design4Page