import React from 'react'
import Navbar from '../components/Navbar/Navbar'
import Kitchen from '../components/Kitchen/Kitchen'
import NavIcons from '../components/Navbar/NavIcons'

function KitchenRoomPage() {
  return (
    <>
    <div className="container-fluid">
      
      <div className="row">
        {/* Left Sidebar: NavIcons */}
        <div className="col-lg-1 col-md-3 col-sm-4 p-0">
          <NavIcons />
        </div>
        {/* Main Content: Kitchen */}
        <div className="col-lg-11 col-md-9 col-sm-8">
          <Navbar />
          <Kitchen />
        </div>
      </div>
    </div>
    </>
  )
}

export default KitchenRoomPage