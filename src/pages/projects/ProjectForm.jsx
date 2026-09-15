import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import api from '../../lib/api'

export default function ProjectForm({ initial, onSuccess }) {
  const isEdit = !!initial
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: initial ? {
      name: initial.name,
      location: initial.location,
      city: initial.city || '',
      description: initial.description || '',
      highlights: initial.highlights || '',
      status: initial.status,
      startingPrice: initial.startingPrice || '',
      mainImage: initial.mainImage || '',
      brochureUrl: initial.brochureUrl || '',
      mapUrl: initial.mapUrl || '',
      isPublished: initial.isPublished,
    } : { status: 'ONGOING', isPublished: false },
  })

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? api.put(`/projects/${initial.id}`, data)
      : api.post('/projects', data),
    onSuccess,
  })

  const onSubmit = (data) => mutation.mutate({
    ...data,
    startingPrice: data.startingPrice ? parseFloat(data.startingPrice) : undefined,
    isPublished: data.isPublished === true || data.isPublished === 'true',
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {mutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {mutation.error?.response?.data?.message || 'Something went wrong.'}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Project Name *</label>
          <input className={`input ${errors.name ? 'border-red-400' : ''}`}
            {...register('name', { required: 'Required' })} />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Location *</label>
          <input className={`input ${errors.location ? 'border-red-400' : ''}`}
            placeholder="Colombo 05"
            {...register('location', { required: 'Required' })} />
        </div>
        <div>
          <label className="label">City</label>
          <input className="input" placeholder="Colombo" {...register('city')} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" {...register('status')}>
            <option value="UPCOMING">Upcoming</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <div>
          <label className="label">Starting Price (LKR)</label>
          <input className="input" type="number" placeholder="5000000" {...register('startingPrice')} />
        </div>
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} {...register('description')} />
        </div>
        <div className="col-span-2">
          <label className="label">Highlights (key features)</label>
          <textarea className="input resize-none" rows={2} placeholder="Infinity Pool, Sky Lounge, ..."
            {...register('highlights')} />
        </div>
        <div className="col-span-2">
          <label className="label">Main Image URL</label>
          <input className="input" placeholder="https://..." {...register('mainImage')} />
        </div>
        <div>
          <label className="label">Brochure URL</label>
          <input className="input" placeholder="https://..." {...register('brochureUrl')} />
        </div>
        <div>
          <label className="label">Map / Location URL</label>
          <input className="input" placeholder="https://maps.google.com/..." {...register('mapUrl')} />
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <input type="checkbox" id="isPublished" className="w-4 h-4 accent-gold-500"
            {...register('isPublished')} />
          <label htmlFor="isPublished" className="text-sm text-gray-700 cursor-pointer">
            Publish this project (visible on the public website)
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
          {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}
        </button>
      </div>
    </form>
  )
}
