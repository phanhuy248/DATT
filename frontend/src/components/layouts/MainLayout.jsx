import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../common/Navbar'
import Footer from '../common/Footer'
import Chatbot from '../common/Chatbot'

export default function MainLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1, paddingBottom: 40 }}>
        <Outlet />
      </main>
      <Footer />
      <Chatbot />
    </div>
  )
}
