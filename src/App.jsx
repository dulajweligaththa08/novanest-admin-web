import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Layout from './components/layout/Layout'
import ProtectedRoute from './components/layout/ProtectedRoute'

import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProjectsPage from './pages/projects/ProjectsPage'
import ProjectDetailPage from './pages/projects/ProjectDetailPage'
import ApartmentsPage from './pages/apartments/ApartmentsPage'
import ListingsPage from './pages/listings/ListingsPage'
import CustomersPage from './pages/customers/CustomersPage'
import CustomerDetailPage from './pages/customers/CustomerDetailPage'
import InquiriesPage from './pages/inquiries/InquiriesPage'
import NewsPage from './pages/news/NewsPage'
import CareersPage from './pages/careers/CareersPage'
import BrochureDownloadsPage from './pages/brochure/BrochureDownloadsPage'

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Protected admin routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="houses" element={<ListingsPage initialType="HOUSE" />} />
        <Route path="land" element={<ListingsPage initialType="LAND" />} />
        <Route path="apartments" element={<ApartmentsPage />} />
        <Route path="listings" element={<ListingsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="inquiries" element={<InquiriesPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="careers" element={<CareersPage />} />
        <Route path="brochure-downloads" element={<BrochureDownloadsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
