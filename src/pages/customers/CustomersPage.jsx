import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users, Search, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import CustomerForm from './CustomerForm'

export default function CustomersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get('/admin/customers', { params: { search, limit: 50 } }).then((r) => r.data.data),
  })

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage customer accounts and apartment assignments"
        action={
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> New Customer
          </button>
        }
      />

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="card p-8 text-center text-gray-400">Loading...</div>
      ) : !data?.length ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title={search ? 'No customers found' : 'No customers yet'}
            description={search ? 'Try a different search term.' : 'Create customer accounts from here. Customers cannot self-register.'}
            action={!search && (
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> New Customer
              </button>
            )}
          />
        </div>
      ) : (
        <Table>
          <Thead>
            <Th>Customer</Th>
            <Th>Phone</Th>
            <Th>Apartments</Th>
            <Th>Status</Th>
            <Th>Joined</Th>
            <Th></Th>
          </Thead>
          <Tbody>
            {data.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <div>
                    <p className="font-medium text-gray-900">{c.fullName}</p>
                    <p className="text-xs text-gray-500">{c.user?.email}</p>
                  </div>
                </Td>
                <Td className="text-gray-600">{c.phone || '—'}</Td>
                <Td className="text-gray-600">{c.customerApartments?.length ?? 0}</Td>
                <Td>
                  {c.user?.isActive
                    ? <span className="badge-resolved">Active</span>
                    : <span className="badge-closed">Inactive</span>
                  }
                </Td>
                <Td className="text-gray-500 text-xs">
                  {new Date(c.user?.createdAt).toLocaleDateString()}
                </Td>
                <Td>
                  <Link
                    to={`/customers/${c.id}`}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 inline-flex"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {showForm && (
        <Modal title="Create Customer Account" onClose={() => setShowForm(false)} size="md">
          <CustomerForm
            onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['customers'] }) }}
          />
        </Modal>
      )}
    </div>
  )
}
