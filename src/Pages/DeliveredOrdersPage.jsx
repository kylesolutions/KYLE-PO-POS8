import React from 'react'
import Navbar from '../components/Navbar/Navbar'
import HomeDeliveryOrders from '../components/Header/HomeDeliveryOrders'
import DeliveredOrders from '../components/Header/DeliveredOrders'

function DeliveredOrdersPage() {
  return (
    <>
    <Navbar/>
    <DeliveredOrders/>
    </>
  )
}

export default DeliveredOrdersPage