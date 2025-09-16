import { BrowserRouter, Route, Routes } from 'react-router-dom'
import UserRouter from './Routes/UserRouter'
import { UserProvider } from './Context/UserContext'
import { ThemeProvider } from './Context/ThemeContext'

function App() {
  

  return (
    <>
    <UserProvider>
      <ThemeProvider>
      <BrowserRouter>
          <Routes>
              <Route path='/*' element={<UserRouter/>}/>
          </Routes>
      </BrowserRouter>
      </ThemeProvider>
    </UserProvider>  
    </>
  )
}

export default App
