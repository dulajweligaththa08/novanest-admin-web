import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Home } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import ApartmentForm from './ApartmentForm'

const statusBadge = {
  AVAILABLE:   'badge-available',
  RESERVED:    'badge-reserved',
  SOLD:        'badge-sold',
  UNAVAILABLE: 'badge-closed',
}

export default function ApartmentsPage() {
  const [searchParams] = useSearchParams()
  const floorId = searchParams.get('floorId')
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['apartments-admin', floorId],
    queryFn: () => api.get('/apartments/admin/all', { params: { floorId, limit: 100 } }).then((r) => r.data.data),
  })

  const { data: types } = useQuery({
    queryKey: ['apartment-types'],
    queryFn: () => api.get('/apartments/types').then((r) => r.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/apartments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['apartments-admin'] }),
  })

  return (
    <div>
      <PageHeader
        title="Properties"
        subtitle="Manage all property listings"
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus className="w-4 h-4" /> New Property
          </button>
        }
      />

      {isLoading ? (
        <div className="card p-8 text-center text-gray-400">Loading...</div>
      ) : !data?.length ? (
        <div className="card">
          <EmptyState icon={Home} title="No properties yet"
            description="Add properties to floors via the Projects page, or create one here."
            action={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> New Property</button>}
          />
        </div>
      ) : (
        <Table>
          <Thead>
            <Th>Listing</Th>
            <Th>Type</Th>
            <Th>Project / Floor</Th>
            <Th>Category</Th>
            <Th>Beds / Baths</Th>
            <Th>Area / Land</Th>
            <Th>Price</Th>
            <Th>Status</Th>
            <Th></Th>
          </Thead>
          <Tbody>
            {data.map((apt) => {
              const project = apt.floor?.building?.project
              const isLand  = apt.propertyType === 'LAND'
              return (
                <Tr key={apt.id}>
                  <Td className="font-medium text-gray-900">{apt.unitNumber}</Td>
                  <Td>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium
                      ${apt.propertyType === 'APARTMENT' ? 'bg-blue-100 text-blue-700'
                      : apt.propertyType === 'HOUSE'     ? 'bg-emerald-100 text-emerald-700'
                      :                                    'bg-amber-100 text-amber-700'}`}>
                      {apt.propertyType}
                    </span>
                  </Td>
                  <Td>
                    <p className="text-sm text-gray-700">{project?.name}</p>
                    <p className="text-xs text-gray-400">Floor {apt.floor?.floorNumber}</p>
                  </Td>
                  <Td className="text-gray-600">{apt.apartmentType?.name || '—'}</Td>
                  <Td className="text-gray-600">
                    {isLand ? '—' : `${apt.bedrooms}BR / ${apt.bathrooms}BA`}
                  </Td>
                  <Td className="text-gray-600">
                    {isLand
                      ? apt.landAreaPerches ? `${apt.landAreaPerches} perches` : '—'
                      : apt.areaSqft ? `${Number(apt.areaSqft).toLocaleString()} sqft` : '—'
                    }
                  </Td>
                  <Td className="text-gray-600">
                    {apt.price ? `LKR ${Number(apt.price).toLocaleString()}` : '—'}
                  </Td>
                  <Td><span className={statusBadge[apt.status]}>{apt.status}</span></Td>
                  <Td>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => { setEditing(apt); setShowForm(true) }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirm(`Delete unit ${apt.unitNumber}?`) && deleteMutation.mutate(apt.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Property' : 'New Property'} onClose={() => setShowForm(false)} size="lg">
          <ApartmentForm
            initial={editing}
            types={types || []}
            floorId={floorId}
            onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['apartments-admin'] }) }}
          />
        </Modal>
      )}
    </div>
  )
}
