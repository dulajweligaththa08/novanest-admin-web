import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import api from '../../lib/api'

export default function JobForm({ initial, onSuccess }) {
  const isEdit = !!initial
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: initial ? {
      title: initial.title,
      department: initial.department,
      location: initial.location,
      type: initial.type,
      description: initial.description,
      requirements: initial.requirements || '',
      status: initial.status,
    } : { status: 'OPEN', type: 'Full-time' },
  })

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/careers/${initial.id}`, data) : api.post('/careers', data),
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
        <label className="label">Job Title *</label>
        <input className={`input ${errors.title ? 'border-red-400' : ''}`}
          placeholder="Senior Software Engineer"
          {...register('title', { required: 'Required' })} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Department *</label>
          <input className="input" placeholder="Engineering"
            {...register('department', { required: 'Required' })} />
        </div>
        <div>
          <label className="label">Location *</label>
          <input className="input" placeholder="Colombo, Sri Lanka"
            {...register('location', { required: 'Required' })} />
        </div>
        <div>
          <label className="label">Type *</label>
          <select className="input" {...register('type', { required: 'Required' })}>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" {...register('status')}>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Description *</label>
        <textarea className={`input resize-none ${errors.description ? 'border-red-400' : ''}`}
          rows={5} placeholder="Role description and responsibilities..."
          {...register('description', { required: 'Required' })} />
      </div>

      <div>
        <label className="label">Requirements</label>
        <textarea className="input resize-none" rows={4}
          placeholder="Required skills and qualifications..."
          {...register('requirements')} />
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Job'}
      </button>
    </form>
  )
}
