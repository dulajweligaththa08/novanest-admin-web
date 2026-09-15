import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ChevronLeft, Plus, Home, FileText, Bell, KeyRound } from 'lucide-react'
import api from '../../lib/api'
import Modal from '../../components/ui/Modal'
import UpdateForm from './UpdateForm'
import DocumentForm from './DocumentForm'
import AssignApartmentForm from './AssignApartmentForm'

export default function CustomerDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [showAssign, setShowAssign] = useState(false)
  const [showUpdate, setShowUpdate] = useState(null) // assignmentId
  const [showDocument, setShowDocument] = useState(null) // assignmentId
  const [showReset, setShowReset] = useState(false)

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get(`/admin/customers/${id}`).then((r) => r.data.data),
  })

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading...</div>
  if (!customer) return <div className="p-8 text-center text-gray-400">Customer not found.</div>

  const assignment = customer.customerApartments?.[0]

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/customers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft className="w-4 h-4" /> Back to Customers
      </Link>

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-navy-900 flex items-center justify-center">
              <span className="text-white text-xl font-bold">{customer.fullName?.[0]}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{customer.fullName}</h2>
              <p className="text-sm text-gray-500">{customer.user?.email}</p>
              {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowReset(true)} className="btn-secondary text-sm">
              <KeyRound className="w-4 h-4" /> Reset Password
            </button>
            <span className={customer.user?.isActive ? 'badge-resolved self-center' : 'badge-closed self-center'}>
              {customer.user?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Apartment assignment */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Home className="w-4 h-4 text-gold-500" /> Apartment</h3>
          <button className="btn-secondary text-sm" onClick={() => setShowAssign(true)}>
            <Plus className="w-4 h-4" /> {assignment ? 'Add Another' : 'Assign Apartment'}
          </button>
        </div>

        {assignment ? (
          <div className="p-5">
            {(() => {
              const apt = assignment.apartment
              const project = apt?.floor?.building?.project
              return (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Unit {apt?.unitNumber}</p>
                    <p className="text-sm text-gray-600">{project?.name}</p>
                    <p className="text-xs text-gray-400">
                      Floor {apt?.floor?.floorNumber} · {apt?.bedrooms}BR / {apt?.bathrooms}BA
                      {apt?.areaSqft ? ` · ${Number(apt.areaSqft).toLocaleString()} sqft` : ''}
                    </p>
                    {assignment.agreedPrice && (
                      <p className="text-sm font-medium text-gold-600 mt-1">
                        LKR {Number(assignment.agreedPrice).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className={`badge-${apt?.status?.toLowerCase()}`}>{apt?.status}</span>
                </div>
              )
            })()}

            {/* Updates */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Bell className="w-4 h-4" /> Updates
                </h4>
                <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => setShowUpdate(assignment.id)}>
                  <Plus className="w-3 h-3" /> Publish Update
                </button>
              </div>
              {assignment.updates?.length ? (
                <div className="space-y-2">
                  {assignment.updates.map((u) => (
                    <div key={u.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{u.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{u.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(u.publishedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No updates yet.</p>
              )}
            </div>

            {/* Documents */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Documents
                </h4>
                <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => setShowDocument(assignment.id)}>
                  <Plus className="w-3 h-3" /> Upload Document
                </button>
              </div>
              {assignment.documents?.length ? (
                <div className="space-y-2">
                  {assignment.documents.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="w-4 h-4 text-gold-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
                        <p className="text-xs text-gray-400">{d.documentType}</p>
                      </div>
                      <a href={d.fileUrl} target="_blank" rel="noreferrer"
                        className="text-xs text-gold-600 hover:underline flex-shrink-0">
                        View
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No documents yet.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="p-5 text-sm text-gray-400">No apartment assigned yet.</p>
        )}
      </div>

      {/* Modals */}
      {showAssign && (
        <Modal title="Assign Apartment" onClose={() => setShowAssign(false)}>
          <AssignApartmentForm
            customerId={id}
            onSuccess={() => { setShowAssign(false); qc.invalidateQueries({ queryKey: ['customer', id] }) }}
          />
        </Modal>
      )}
      {showUpdate && (
        <Modal title="Publish Update" onClose={() => setShowUpdate(null)}>
          <UpdateForm
            assignmentId={showUpdate}
            onSuccess={() => { setShowUpdate(null); qc.invalidateQueries({ queryKey: ['customer', id] }) }}
          />
        </Modal>
      )}
      {showDocument && (
        <Modal title="Upload Document" onClose={() => setShowDocument(null)}>
          <DocumentForm
            assignmentId={showDocument}
            onSuccess={() => { setShowDocument(null); qc.invalidateQueries({ queryKey: ['customer', id] }) }}
          />
        </Modal>
      )}
      {showReset && (
        <Modal title="Reset Password" onClose={() => setShowReset(false)}>
          <ResetPasswordForm
            customerId={id}
            onSuccess={() => setShowReset(false)}
          />
        </Modal>
      )}
    </div>
  )
}

function ResetPasswordForm({ customerId, onSuccess }) {
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm()
  const mutation = useMutation({
    mutationFn: (data) => api.post(`/admin/customers/${customerId}/reset-password`, data),
    onSuccess,
  })
  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      {mutation.isError && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
          {mutation.error?.response?.data?.message || 'Error'}
        </div>
      )}
      {mutation.isSuccess && (
        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg">Password reset successfully.</div>
      )}
      <div>
        <label className="label">New Password *</label>
        <input className={`input ${errors.newPassword ? 'border-red-400' : ''}`}
          type="text"
          {...register('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  )
}
