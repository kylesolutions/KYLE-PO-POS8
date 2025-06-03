import React from 'react'
import Navbar from '../components/Navbar/Navbar'
import Dispatch from '../components/Kitchen/Dispatch'
import NavIcons from '../components/Navbar/NavIcons'

function DispatchPage() {
  return (
    <>
    <div className="container-fluid">
      <div className="row">
        {/* Left Sidebar: NavIcons */}
        <div className="col-lg-1 col-md-3 col-sm-4 p-0">
          <NavIcons />
        </div>
        {/* Main Content: Navbar and Dispatch */}
        <div className="col-lg-11 col-md-9 col-sm-8">
          <Navbar />
          <Dispatch />
        </div>
      </div>
    </div>
    </>
  )
}

export default DispatchPage