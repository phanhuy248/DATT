import React, { createContext, useContext, useState } from 'react'
import * as authApi from '../api/auth'
import { getMe } from '../api/users'
import { invalidateSession } from '../api/axios'

const AuthContext = createContext(null)

const saveAuthData = (data) => {
  localStorage.setItem('accessToken', data.accessToken)
  if (data.refreshToken) {
    localStorage.setItem('refreshToken', data.refreshToken)
  }
  localStorage.setItem('user', JSON.stringify(data.user))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)

  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const data = await authApi.login(email, password)
      saveAuthData(data)
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (formData) => {
    setLoading(true)
    try {
      const data = await authApi.register(formData)
      saveAuthData(data)
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  const requestRegistrationOtp = async (formData) => {
    setLoading(true)
    try {
      return await authApi.requestRegistrationOtp(formData)
    } finally {
      setLoading(false)
    }
  }

  const verifyRegistrationOtp = async (email, otp) => {
    setLoading(true)
    try {
      const data = await authApi.verifyRegistrationOtp(email, otp)
      saveAuthData(data)
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  const completeOAuthLogin = async (accessToken, refreshToken) => {
    setLoading(true)
    try {
      localStorage.setItem('accessToken', accessToken)
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      const currentUser = await getMe()
      saveAuthData({ accessToken, refreshToken, user: currentUser })
      setUser(currentUser)
      return currentUser
    } finally {
      setLoading(false)
    }
  }

  const completeGoogleProfile = async (profileData) => {
    setLoading(true)
    try {
      const data = await authApi.completeGoogleProfile(profileData)
      saveAuthData(data)
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  const refreshCurrentUser = async () => {
    const currentUser = await getMe()
    localStorage.setItem('user', JSON.stringify(currentUser))
    setUser(currentUser)
    return currentUser
  }

  const signOut = () => {
    // Huỷ mọi request đang chờ refresh token của phiên cũ trước khi xoá dữ liệu
    invalidateSession()
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      authApi.logout(refreshToken).catch(() => {})
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateUser = (updatedUser) => {
    const newUser = { ...user, ...updatedUser }
    localStorage.setItem('user', JSON.stringify(newUser))
    setUser(newUser)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      requestRegistrationOtp,
      verifyRegistrationOtp,
      signOut,
      updateUser,
      completeOAuthLogin,
      completeGoogleProfile,
      refreshCurrentUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
