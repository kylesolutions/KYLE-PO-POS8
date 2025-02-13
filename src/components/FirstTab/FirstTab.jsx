import React from 'react'
import './firstTab.css'
import { useNavigate } from 'react-router-dom'

function FirstTab() {
    const navigate = useNavigate()
  return (
    <>
   
       <div className='container-fluid main'>
        <i class="fi fi-rs-angle-small-left back-button"  onClick={()=> navigate('/')}></i>
            <div className='row'>
                <div className='mainTab col-lg-6 d-flex align-items-center justify-content-center'>
                    <button className='text-center mainButton' onClick={()=> navigate('/frontpage')}>TAKE AWAY</button> 
                </div>
                <div className='mainTab col-lg-6 d-flex align-items-center justify-content-center'>
                    <button className='text-center mainButton' onClick={()=> navigate('/table')}>DINE IN</button>  
                </div>
                
            </div>
       </div>
    </>
  )
}

export default FirstTab