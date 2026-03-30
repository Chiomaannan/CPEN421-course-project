import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const AUTH_URL = 'http://localhost:3001'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('gercs_token'))
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (tkn) => {
    try {
      const res = await axios.get(`${AUTH_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${tkn}` },
      })
      setUser(res.data.user)
    } catch {
      localStorage.removeItem('gercs_token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token) {
      fetchProfile(token)
    } else {
      setLoading(false)
    }
  }, [token, fetchProfile])

  const login = async (email, password) => {
    const res = await axios.post(`${AUTH_URL}/auth/login`, { email, password })
    const { accessToken: newToken, user: newUser } = res.data
    localStorage.setItem('gercs_token', newToken)
    setToken(newToken)
    setUser(newUser)
    return newUser
  }

  const register = async (name, email, password, role) => {
    const res = await axios.post(`${AUTH_URL}/auth/register`, { name, email, password, role })
    const { accessToken: newToken, user: newUser } = res.data
    localStorage.setItem('gercs_token', newToken)
    setToken(newToken)
    setUser(newUser)
    return newUser
  }

  const logout = () => {
    localStorage.removeItem('gercs_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
