import React from 'react'
import Navbar from '../components/Navbar/Navbar'
import DeliveredOrders from '../components/Header/DeliveredOrders'
import NavIcons from '../components/Navbar/NavIcons'

function DeliveredOrdersPage() {
  return (
    <>
    <div className="container-fluid">
        <div className='row'>
          <div className="col-lg-1 col-md-3 col-sm-4 p-0">
              <NavIcons/>
          </div>
        <div className="col-lg-11 col-md-9 col-sm-8">
          <Navbar/>
          <DeliveredOrders/>
        </div>
      </div>
    </div>
    </>
  )
}

export default DeliveredOrdersPage