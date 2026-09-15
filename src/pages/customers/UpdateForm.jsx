import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import api from '../../lib/api'

const UPDATE_TYPES = [
  ['BOOKING_CONFIRMATION',   'Booking Confirmation'],
  ['PAYMENT_UPDATE',         'Payment Update'],
  ['CONSTRUCTION_PROGRESS',  'Construction Progress'],
  ['APARTMENT_COMPLETION',   'Apartment Completion'],
  ['HANDOVER_INFORMATION',   'Handover Information'],
  ['IMPORTANT_ANNOUNCEMENT', 'Important Announcement'],
  ['INSPECTION_UPDATE',      'Inspection / Schedule Update'],
  ['DOCUMENT_UPDATE',        'Document Update'],
  ['GENERAL',                'General'],
]

export default function UpdateForm({ assignmentId, onSuccess }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { updateType: 'GENERAL' },
  })

  const mutation = useMutation({
    mutationFn: (data) => api.post(`/admin/assignments/${assignmentId}/updates`, data),
    onSuccess,
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      {mutation.isError && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
          {mutation.error?.response?.data?.message || 'Error'}
        </div>
      )}
      <div>
        <label className="label">Update Type</label>
        <select className="input" {...register('updateType')}>
          {UPDATE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Title *</label>
        <input className={`input ${errors.title ? 'border-red-400' : ''}`}
          placeholder="e.g. Interior finishing completed"
          {...register('title', { required: 'Required' })} />
      </div>
      <div>
        <label className="label">Description *</label>
        <textarea className={`input resize-none ${errors.description ? 'border-red-400' : ''}`}
          rows={4}
          placeholder="Provide details about this update..."
          {...register('description', { required: 'Required' })} />
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? 'Publishing...' : 'Publish Update'}
      </button>
    </form>
  )
}
