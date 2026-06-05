import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../common/Navbar'
import Footer from '../common/Footer'
import Chatbot from '../common/Chatbot'

export default function MainLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-shop-bg text-shop-text">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {location.pathname !== '/' && <Chatbot />}
    </div>
  )
}
