import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../../lib/api'

export default function AssignApartmentForm({ customerId, onSuccess }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { isPrimary: true },
  })

  const { data: apartments } = useQuery({
    queryKey: ['apartments-available'],
    queryFn: () => api.get('/apartments/admin/all', { params: { status: 'AVAILABLE', limit: 200 } })
      .then((r) => r.data.data),
  })

  const mutation = useMutation({
    mutationFn: (data) => api.post(`/admin/customers/${customerId}/apartments`, data),
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
        <label className="label">Select Apartment *</label>
        <select className={`input ${errors.apartmentId ? 'border-red-400' : ''}`}
          {...register('apartmentId', { required: 'Required' })}>
          <option value="">— Choose an apartment —</option>
          {apartments?.map((a) => {
            const project = a.floor?.building?.project
            return (
              <option key={a.id} value={a.id}>
                {a.unitNumber} — {project?.name} Floor {a.floor?.floorNumber} ({a.bedrooms}BR)
              </option>
            )
          })}
        </select>
      </div>
      <div>
        <label className="label">Booking Date</label>
        <input className="input" type="date" {...register('bookingDate')} />
      </div>
      <div>
        <label className="label">Agreed Price (LKR)</label>
        <input className="input" type="number" placeholder="35000000" {...register('agreedPrice')} />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input resize-none" rows={2} {...register('notes')} />
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="primary" className="w-4 h-4 accent-gold-500" {...register('isPrimary')} />
        <label htmlFor="primary" className="text-sm text-gray-700 cursor-pointer">Primary apartment</label>
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? 'Assigning...' : 'Assign Apartment'}
      </button>
    </form>
  )
}
