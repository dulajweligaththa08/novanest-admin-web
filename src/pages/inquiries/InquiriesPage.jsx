import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Search, UserPlus, CheckCircle } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import CustomerForm from '../customers/CustomerForm'

const STATUSES = ['', 'NEW', 'CONTACTED', 'RESOLVED', 'CLOSED']

const statusBadge = {
  NEW:       'badge-new',
  CONTACTED: 'badge-contacted',
  RESOLVED:  'badge-resolved',
  CLOSED:    'badge-closed',
}

export default function InquiriesPage() {
  const qc       = useQueryClient()
  const navigate = useNavigate()

  const [status,   setStatus]   = useState('')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)
  // showCreate: open the CustomerForm modal pre-filled from the inquiry
  const [showCreate, setShowCreate] = useState(false)
  // createdCustomerId: after successful creation, offer navigation
  const [createdCustomerId, setCreatedCustomerId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['inquiries', status, search],
    queryFn: () => api.get('/inquiries', { params: { status, search, limit: 50 } }).then((r) => r.data.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/inquiries/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inquiries'] }),
  })

  // Pre-fill data from the selected inquiry for CustomerForm
  const inquiryPrefill = selected
    ? {
        fullName: selected.customerName,
        email:    selected.email,
        phone:    selected.phone || '',
      }
    : {}

  // After customer created: mark inquiry as CONTACTED and redirect
  const handleCustomerCreated = async (res) => {
    const newCustomerId = res?.data?.data?.id || res?.data?.id
    setCreatedCustomerId(newCustomerId)
    setShowCreate(false)

    // Auto-mark the inquiry as CONTACTED
    if (selected?.id) {
      updateMutation.mutate({ id: selected.id, status: 'CONTACTED' })
      setSelected(prev => ({ ...prev, status: 'CONTACTED' }))
    }
    qc.invalidateQueries({ queryKey: ['customers'] })
  }

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
                ${status === s ? 'bg-navy-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
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
            <Th>Project / Unit</Th>
            <Th>Status</Th>
            <Th>Date</Th>
          </Thead>
          <Tbody>
            {data.map((inq) => (
              <Tr key={inq.id} onClick={() => { setSelected(inq); setCreatedCustomerId(null) }}>
                <Td className="font-medium text-gray-900">{inq.customerName}</Td>
                <Td>
                  <p className="text-sm text-gray-700">{inq.email}</p>
                  {inq.phone && <p className="text-xs text-gray-400">{inq.phone}</p>}
                </Td>
                <Td className="text-gray-600">
                  <p>{inq.project?.name || '—'}</p>
                  {inq.apartment && (
                    <p className="text-xs text-gray-400">Unit {inq.apartment.unitNumber}</p>
                  )}
                </Td>
                <Td><span className={statusBadge[inq.status]}>{inq.status}</span></Td>
                <Td className="text-xs text-gray-400">
                  {new Date(inq.createdAt).toLocaleDateString()}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {/* ── Inquiry Detail Modal ── */}
      {selected && (
        <Modal title="Inquiry Detail" onClose={() => { setSelected(null); setCreatedCustomerId(null) }} size="md">
          <div className="space-y-4">

            {/* ── Customer created confirmation ── */}
            {createdCustomerId && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-semibold">Customer account created successfully.</p>
                </div>
                <p className="text-xs text-emerald-600">
                  The inquiry has been marked as <strong>CONTACTED</strong>. Now go to the
                  customer's profile to assign a property and set up their purchase process.
                </p>
                <button
                  onClick={() => navigate(`/customers/${createdCustomerId}`)}
                  className="btn-primary text-sm w-full justify-center"
                >
                  Open Customer Profile →
                </button>
              </div>
            )}

            {/* ── Inquiry details ── */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Name</p>
                <p className="text-gray-900 font-medium">{selected.customerName}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Email</p>
                <a href={`mailto:${selected.email}`} className="text-gold-600 hover:underline">
                  {selected.email}
                </a>
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
              {selected.apartment && (
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Unit</p>
                  <p className="text-gray-900">Unit {selected.apartment.unitNumber}</p>
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
                  setSelected(p => ({ ...p, status: newStatus }))
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

            {/* ── Action buttons ── */}
            <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
              {/* Convert to Customer — primary CTA */}
              {!createdCustomerId && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="btn-primary w-full justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Create Customer Account for {selected.customerName.split(' ')[0]}
                </button>
              )}

              <a
                href={`mailto:${selected.email}?subject=Re: Your NovaNest Enquiry`}
                className="btn-secondary w-full justify-center text-sm text-gray-700 border-gray-200"
              >
                Reply via Email
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Create Customer Modal (pre-filled from inquiry) ── */}
      {showCreate && selected && (
        <Modal
          title={`Create Account — ${selected.customerName}`}
          onClose={() => setShowCreate(false)}
          size="md"
        >
          {/* Context banner */}
          <div className="p-3 bg-gold-50 border border-gold-200 rounded-xl mb-4 text-xs text-gold-800">
            <p className="font-semibold mb-0.5">Creating account from inquiry</p>
            <p className="text-gold-700">
              Name, email, and phone have been pre-filled from the inquiry.
              After creating the account, assign the relevant property and set up the purchase process.
            </p>
          </div>

          <CustomerForm
            prefill={inquiryPrefill}
            onSuccess={handleCustomerCreated}
          />
        </Modal>
      )}
    </div>
  )
}
