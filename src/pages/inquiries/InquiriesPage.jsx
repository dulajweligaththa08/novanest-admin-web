import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Search } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'

const STATUSES = ['', 'NEW', 'CONTACTED', 'RESOLVED', 'CLOSED']

const statusBadge = {
  NEW:       'badge-new',
  CONTACTED: 'badge-contacted',
  RESOLVED:  'badge-resolved',
  CLOSED:    'badge-closed',
}

export default function InquiriesPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['inquiries', status, search],
    queryFn: () => api.get('/inquiries', { params: { status, search, limit: 50 } }).then((r) => r.data.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/inquiries/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inquiries'] })
      setSelected((prev) => prev ? { ...prev, ...updateMutation.variables } : null)
    },
  })

  return (
    <div>
      <PageHeader title="Inquiries" subtitle="Manage all property and apartment inquiries" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9 w-64" placeholder="Search name or email..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {STATUSES.map((s) => (
            <button key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${status === s ? 'bg-navy-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center text-gray-400">Loading...</div>
      ) : !data?.length ? (
        <div className="card">
          <EmptyState icon={MessageSquare} title="No inquiries found" />
        </div>
      ) : (
        <Table>
          <Thead>
            <Th>Name</Th>
            <Th>Contact</Th>
            <Th>Project</Th>
            <Th>Status</Th>
            <Th>Date</Th>
          </Thead>
          <Tbody>
            {data.map((inq) => (
              <Tr key={inq.id} onClick={() => setSelected(inq)}>
                <Td className="font-medium text-gray-900">{inq.customerName}</Td>
                <Td>
                  <p className="text-sm text-gray-700">{inq.email}</p>
                  {inq.phone && <p className="text-xs text-gray-400">{inq.phone}</p>}
                </Td>
                <Td className="text-gray-600">{inq.project?.name || '—'}</Td>
                <Td><span className={statusBadge[inq.status]}>{inq.status}</span></Td>
                <Td className="text-xs text-gray-400">
                  {new Date(inq.createdAt).toLocaleDateString()}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {selected && (
        <Modal title="Inquiry Detail" onClose={() => setSelected(null)} size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Name</p>
                <p className="text-gray-900 font-medium">{selected.customerName}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Email</p>
                <a href={`mailto:${selected.email}`} className="text-gold-600 hover:underline">{selected.email}</a>
              </div>
              {selected.phone && (
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Phone</p>
                  <p className="text-gray-900">{selected.phone}</p>
                </div>
              )}
              {selected.project && (
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Project</p>
                  <p className="text-gray-900">{selected.project.name}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Message</p>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 leading-relaxed">
                {selected.message}
              </div>
            </div>

            <div>
              <label className="label">Status</label>
              <select className="input"
                value={selected.status}
                onChange={(e) => {
                  const newStatus = e.target.value
                  setSelected((p) => ({ ...p, status: newStatus }))
                  updateMutation.mutate({ id: selected.id, status: newStatus })
                }}>
                {['NEW', 'CONTACTED', 'RESOLVED', 'CLOSED'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Admin Notes</label>
              <textarea className="input resize-none" rows={3}
                defaultValue={selected.adminNotes || ''}
                onBlur={(e) => updateMutation.mutate({ id: selected.id, adminNotes: e.target.value })}
                placeholder="Internal notes..." />
            </div>

            <a href={`mailto:${selected.email}?subject=Re: Your NovaNest Inquiry`}
              className="btn-primary w-full justify-center">
              Reply via Email
            </a>
          </div>
        </Modal>
      )}
    </div>
  )
}
