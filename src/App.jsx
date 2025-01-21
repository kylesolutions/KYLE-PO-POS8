import { BrowserRouter, Route, Routes } from 'react-router-dom'
import UserRouter from './Routes/UserRouter'
import { UserProvider } from './Context/UserContext'

function App() {
  

  return (
    <>
    <UserProvider>
      <BrowserRouter>
          <Routes>
              <Route path='/*' element={<UserRouter/>}/>
          </Routes>
      </BrowserRouter>
    </UserProvider>  
    </>
  )
}

export default App
