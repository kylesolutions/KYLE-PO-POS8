import React from 'react'
import Design2Nav from '../components/Designs/Design2/Design2Nav'
import Design2Headers from '../components/Designs/Design2/Design2Headers'
import Design2Cart from '../components/Designs/Design2/Design2Cart'

function Design2Page() {
  return (
    <>
        <div className='container-fluid'>
        <div className='row'>
            <div className='col-lg-1'>
                <Design2Nav/>
            </div>
            <div className='col-lg-8'>
                <Design2Headers/>
            </div>
            <div className='col-lg-3'>
                <Design2Cart/>
            </div>
        </div>
    </div> 
    </>
  )
}

export default Design2Page