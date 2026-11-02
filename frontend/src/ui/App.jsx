import { Route, Routes } from 'react-router'
import HomePage from './pages/HomePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import WhiteboardPage from './pages/WhiteboardPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pizarra" element={<WhiteboardPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
