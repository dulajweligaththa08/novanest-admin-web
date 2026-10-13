import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Home, MapPin, Eye, EyeOff } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import ListingForm from './ListingForm'

const TYPE_TAB = [
  { value: '',      label: 'All' },
  { value: 'HOUSE', label: '🏠 Houses' },
  { value: 'LAND',  label: '🌿 Land' },
]

const statusBadge = {
  AVAILABLE:   'badge-available',
  RESERVED:    'badge-reserved',
  SOLD:        'badge-sold',
  UNAVAILABLE: 'badge-closed',
}

export default function ListingsPage({ initialType = '' }) {
  const qc = useQueryClient()
  const [typeFilter, setTypeFilter] = useState(initialType)
  const [showForm,   setShowForm]   = useState(false)
  const [editing,    setEditing]    = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['listings-admin', typeFilter],
    queryFn: () =>
      api.get('/listings/admin/all', { params: { listingType: typeFilter || undefined, limit: 100 } })
        .then(r => r.data.data),
  })

  const { data: projects } = useQuery({
    queryKey: ['projects-admin'],
    queryFn: () => api.get('/projects/admin/all').then(r => r.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/listings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listings-admin'] }),
  })

  const handleSuccess = () => {
    setShowForm(false)
    setEditing(null)
    qc.invalidateQueries({ queryKey: ['listings-admin'] })
  }

  return (
    <div>
      <PageHeader
        title="Houses & Land"
        subtitle="Manage standalone house and land listings"
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus className="w-4 h-4" /> New Listing
          </button>
        }
      />

      {/* Type filter tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {TYPE_TAB.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTypeFilter(value)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all
              ${typeFilter === value
                ? 'border-gold-500 text-navy-900'
                : 'border-transparent text-gray-500 hover:text-navy-900 hover:border-gray-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card p-8 text-center text-gray-400">Loading...</div>
      ) : !data?.length ? (
        <div className="card">
          <EmptyState
            icon={Home}
            title="No listings yet"
            description="Add house or land listings here. These are separate from apartment units."
            action={
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> New Listing
              </button>
            }
          />
        </div>
      ) : (
        <Table>
          <Thead>
            <Th>Listing</Th>
            <Th>Type</Th>
            <Th>Location</Th>
            <Th>Details</Th>
            <Th>Price</Th>
            <Th>Status</Th>
            <Th>Published</Th>
            <Th></Th>
          </Thead>
          <Tbody>
            {data.map(listing => (
              <Tr key={listing.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    {listing.mainImage || listing.gallery?.[0]?.imageUrl ? (
                      <img
                        src={listing.mainImage || listing.gallery[0].imageUrl}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        alt=""
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Home className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 leading-tight">{listing.title}</p>
                      {listing.project && (
                        <p className="text-xs text-gray-400">{listing.project.name}</p>
                      )}
                    </div>
                  </div>
                </Td>
                <Td>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium
                    ${listing.listingType === 'HOUSE'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'}`}>
                    {listing.listingType === 'HOUSE' ? '🏠 House' : '🌿 Land'}
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate max-w-[140px]">{listing.location}</span>
                  </div>
                </Td>
                <Td className="text-sm text-gray-600">
                  {listing.listingType === 'HOUSE' ? (
                    <span>
                      {listing.bedrooms != null && `${listing.bedrooms}BR`}
                      {listing.bathrooms != null && ` / ${listing.bathrooms}BA`}
                      {listing.storeys   != null && ` · ${listing.storeys} ${listing.storeys === 1 ? 'storey' : 'storeys'}`}
                    </span>
                  ) : (
                    <span>
                      {listing.landAreaPerches != null && `${listing.landAreaPerches} perches`}
                      {listing.landType && ` · ${listing.landType}`}
                    </span>
                  )}
                </Td>
                <Td className="text-gray-600 font-medium">
                  {listing.price ? `LKR ${Number(listing.price).toLocaleString()}` : '—'}
                </Td>
                <Td>
                  <span className={statusBadge[listing.status]}>{listing.status}</span>
                </Td>
                <Td>
                  {listing.isPublished
                    ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium"><Eye className="w-3 h-3" /> Live</span>
                    : <span className="flex items-center gap-1 text-gray-400 text-xs"><EyeOff className="w-3 h-3" /> Draft</span>
                  }
                </Td>
                <Td>
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => { setEditing(listing); setShowForm(true) }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => confirm(`Delete "${listing.title}"?`) && deleteMutation.mutate(listing.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {showForm && (
        <Modal
          title={editing ? `Edit — ${editing.title}` : 'New Listing'}
          onClose={() => { setShowForm(false); setEditing(null) }}
          size="lg"
        >
          <ListingForm
            initial={editing}
            projects={projects || []}
            onSuccess={handleSuccess}
          />
        </Modal>
      )}
    </div>
  )
}
