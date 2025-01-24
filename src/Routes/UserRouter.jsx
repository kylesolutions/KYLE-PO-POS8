import React from 'react'
import { Route, Routes } from 'react-router-dom'
import TablePage from '../Pages/TablePage'
import FrontPage from '../Pages/FrontPage'
import KitchenRoomPage from '../Pages/KitchenRoomPage'
import BearerPage from '../Pages/BearerPage'
import CashPage from '../Pages/CashPage'
import CardPage from '../Pages/CardPage'
import FirstTab from '../components/FirstTab/FirstTab'
import SavedOrderPage from '../Pages/SavedOrderPage'
import BearerLoginPage from '../Pages/BearerLoginPage'


function UserRouter() {
  return (
    <>
    <Routes>
        <Route path='/' element={<FirstTab/>}/>
        <Route path='table' element={<TablePage/>}/>
        <Route path='frontpage' element={<FrontPage/>}/>
        <Route path='kitchen' element={<KitchenRoomPage/>}/>
        <Route path='bearer' element={<BearerPage/>}/>
        <Route path='cash' element={<CashPage/>}/>
        <Route path='card' element={<CardPage/>}/>
        <Route path='savedorders' element={<SavedOrderPage/>}/>
        <Route path='bearerlogin' element={<BearerLoginPage/>}/>
    </Routes>
    </>
  )
}

export default UserRouter