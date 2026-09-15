import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import api from '../../lib/api'

const DOC_TYPES = [
  ['BOOKING_AGREEMENT', 'Booking Agreement'],
  ['PAYMENT_SCHEDULE',  'Payment Schedule'],
  ['LEGAL_DOCUMENT',    'Legal Document'],
  ['APARTMENT_DOCUMENT','Apartment Document'],
  ['OTHER',             'Other'],
]

export default function DocumentForm({ assignmentId, onSuccess }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { documentType: 'OTHER' },
  })

  const mutation = useMutation({
    mutationFn: (data) => api.post(`/admin/assignments/${assignmentId}/documents`, data),
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
        <label className="label">Document Title *</label>
        <input className={`input ${errors.title ? 'border-red-400' : ''}`}
          placeholder="Booking Agreement"
          {...register('title', { required: 'Required' })} />
      </div>
      <div>
        <label className="label">Document Type</label>
        <select className="input" {...register('documentType')}>
          {DOC_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="label">File URL *</label>
        <input className={`input ${errors.fileUrl ? 'border-red-400' : ''}`}
          placeholder="https://..."
          {...register('fileUrl', { required: 'Required' })} />
        <p className="text-xs text-gray-400 mt-1">Upload the file to cloud storage and paste the URL here.</p>
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={2} {...register('description')} />
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? 'Uploading...' : 'Share Document'}
      </button>
    </form>
  )
}
