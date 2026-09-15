import axios from 'axios'

// In production (Netlify), use the deployed backend URL via env variable.
// In development, Vite proxies /api → localhost:5000 so we use /api.
const baseURL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL,
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
