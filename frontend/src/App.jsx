import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { useAuth } from './context/AuthContext'

import MainLayout from './components/layouts/MainLayout'
import AdminLayout from './components/layouts/AdminLayout'
import ProtectedRoute from './components/common/ProtectedRoute'

// Lazy load tất cả pages — chỉ tải khi user điều hướng tới
const HomePage = lazy(() => import('./pages/client/HomePage'))
const ProductsPage = lazy(() => import('./pages/client/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/client/ProductDetailPage'))
const CartPage = lazy(() => import('./pages/client/CartPage'))
const CheckoutPage = lazy(() => import('./pages/client/CheckoutPage'))
const OrderSuccessPage = lazy(() => import('./pages/client/OrderSuccessPage'))
const OrderHistoryPage = lazy(() => import('./pages/client/OrderHistoryPage'))
const AccountPage = lazy(() => import('./pages/client/AccountPage'))
const NewsPage = lazy(() => import('./pages/client/NewsPage'))
const PostDetailPage = lazy(() => import('./pages/client/PostDetailPage'))
const InfoPage = lazy(() => import('./pages/client/InfoPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const OAuth2CallbackPage = lazy(() => import('./pages/auth/OAuth2CallbackPage'))
const OAuth2CompleteProfilePage = lazy(() => import('./pages/auth/OAuth2CompleteProfilePage'))
const AdminLoginPage = lazy(() => import('./pages/auth/AdminLoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))

const AdminDashboard = lazy(() => import('./pages/admin/DashboardPage'))
const AdminProducts = lazy(() => import('./pages/admin/ProductsPage'))
const AdminCategories = lazy(() => import('./pages/admin/CategoriesPage'))
const AdminUsers = lazy(() => import('./pages/admin/UsersPage'))
const AdminOrders = lazy(() => import('./pages/admin/OrdersPage'))
const AdminCoupons = lazy(() => import('./pages/admin/CouponsPage'))
const AdminSuppliers = lazy(() => import('./pages/admin/SuppliersPage'))
const AdminPosts = lazy(() => import('./pages/admin/PostsPage'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Đang tải...</span>
      </div>
    </div>
  )
}

export default function App() {
  const { user } = useAuth()

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Client routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:slug" element={<PostDetailPage />} />
            <Route path="/info/:slug" element={<InfoPage />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
            <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
            <Route path="/oauth2/complete-profile" element={<OAuth2CompleteProfilePage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/admin/login" element={user?.role === 'ADMIN' ? <Navigate to="/admin/dashboard" /> : <AdminLoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
              <Route path="/orders" element={<OrderHistoryPage />} />
              <Route path="/account" element={<AccountPage />} />
            </Route>
          </Route>

          {/* Admin routes */}
          <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/admin/suppliers" element={<AdminSuppliers />} />
              <Route path="/admin/posts" element={<AdminPosts />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  )
}
