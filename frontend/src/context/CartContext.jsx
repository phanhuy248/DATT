import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as cartApi from '../api/cart'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState({ items: [], totalPrice: 0, totalItems: 0 })
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    if (!user) { setCart({ items: [], totalPrice: 0, totalItems: 0 }); return }
    try {
      const data = await cartApi.getCart()
      setCart(data)
    } catch {
      setCart({ items: [], totalPrice: 0, totalItems: 0 })
    }
  }, [user])

  useEffect(() => { fetchCart() }, [fetchCart])

  const addToCart = async (productId, quantity = 1) => {
    setLoading(true)
    try {
      const data = await cartApi.addToCart(productId, quantity)
      setCart(data)
      return data
    } finally {
      setLoading(false)
    }
  }

  const updateItem = async (cartItemId, quantity) => {
    setLoading(true)
    try {
      const data = await cartApi.updateCartItem(cartItemId, quantity)
      setCart(data)
    } finally {
      setLoading(false)
    }
  }

  const removeItem = async (cartItemId) => {
    setLoading(true)
    try {
      const data = await cartApi.removeCartItem(cartItemId)
      setCart(data || { items: [], totalPrice: 0, totalItems: 0 })
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async () => {
    await cartApi.clearCart()
    setCart({ items: [], totalPrice: 0, totalItems: 0 })
  }

  return (
    <CartContext.Provider value={{ cart, loading, fetchCart, addToCart, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
