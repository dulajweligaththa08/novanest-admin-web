import axios from 'axios'

// In production VITE_API_URL is set to the Railway backend URL,
// e.g. https://novanest-backend.up.railway.app
// In development Vite proxies /api → localhost:5000 so no env var is needed.
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nn_admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global response error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nn_admin_token')
      localStorage.removeItem('nn_admin_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
