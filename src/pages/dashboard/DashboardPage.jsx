import { useQuery } from '@tanstack/react-query'
import { Building2, Home, Users, MessageSquare, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import StatCard from '../../components/ui/StatCard'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import { useAuth } from '../../context/AuthContext'

const statusBadge = {
  NEW:       'badge-new',
  CONTACTED: 'badge-contacted',
  RESOLVED:  'badge-resolved',
  CLOSED:    'badge-closed',
}

const updateTypeLabel = {
  BOOKING_CONFIRMATION:  'Booking',
  PAYMENT_UPDATE:        'Payment',
  CONSTRUCTION_PROGRESS: 'Construction',
  APARTMENT_COMPLETION:  'Completion',
  HANDOVER_INFORMATION:  'Handover',
  IMPORTANT_ANNOUNCEMENT:'Announcement',
  INSPECTION_UPDATE:     'Inspection',
  DOCUMENT_UPDATE:       'Document',
  GENERAL:               'General',
}

export default function DashboardPage() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data.data),
  })

  const stats = data?.stats

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Good {getTimeOfDay()}, {user?.fullName?.split(' ')[0] || 'Admin'} 👋
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Here's what's happening at NovaNest today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Projects"    value={stats?.totalProjects}        icon={Building2}     color="gold"  />
        <StatCard label="Available"   value={stats?.availableApartments}  icon={Home}          color="green" />
        <StatCard label="Reserved"    value={stats?.reservedApartments}   icon={Clock}         color="amber" />
        <StatCard label="Sold"        value={stats?.soldApartments}       icon={CheckCircle}   color="blue"  />
        <StatCard label="Customers"   value={stats?.totalCustomers}       icon={Users}         color="gold"  />
        <StatCard label="New Inquiries" value={stats?.newInquiries}       icon={MessageSquare} color="red"   />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Inquiries */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Inquiries</h3>
            <Link to="/inquiries" className="text-sm text-gold-600 hover:text-gold-700 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {isLoading ? (
              <LoadingSkeleton rows={5} />
            ) : data?.recentInquiries?.length ? (
              data.recentInquiries.map((inq) => (
                <div key={inq.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-gray-600">
                      {inq.customerName?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{inq.customerName}</p>
                    <p className="text-xs text-gray-500 truncate">{inq.project?.name || 'General inquiry'}</p>
                  </div>
                  <span className={statusBadge[inq.status]}>{inq.status}</span>
                </div>
              ))
            ) : (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No inquiries yet</p>
            )}
          </div>
        </div>

        {/* Recent Updates */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Customer Updates</h3>
            <Link to="/customers" className="text-sm text-gold-600 hover:text-gold-700 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {isLoading ? (
              <LoadingSkeleton rows={5} />
            ) : data?.recentUpdates?.length ? (
              data.recentUpdates.map((upd) => (
                <div key={upd.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-navy-900/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-navy-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{upd.title}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {upd.customerApartment?.customer?.fullName}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {updateTypeLabel[upd.updateType] || upd.updateType}
                  </span>
                </div>
              ))
            ) : (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No updates yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton({ rows = 4 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-gray-100" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  ))
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
