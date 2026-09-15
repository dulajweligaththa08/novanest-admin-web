import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../../lib/api'

export default function ApartmentForm({ initial, types = [], floorId, onSuccess }) {
  const isEdit = !!initial

  // Fetch projects + buildings + floors for the floor selector when creating
  const { data: projects } = useQuery({
    queryKey: ['projects-admin'],
    queryFn: () => api.get('/projects/admin/all').then((r) => r.data.data),
    enabled: !isEdit,
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: initial ? {
      unitNumber: initial.unitNumber,
      apartmentTypeId: initial.apartmentTypeId || '',
      bedrooms: initial.bedrooms,
      bathrooms: initial.bathrooms,
      areaSqft: initial.areaSqft || '',
      price: initial.price || '',
      status: initial.status,
      description: initial.description || '',
      isPublished: initial.isPublished,
    } : {
      status: 'AVAILABLE',
      bedrooms: 2,
      bathrooms: 2,
      isPublished: false,
      floorId: floorId || '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEdit) return api.put(`/apartments/${initial.id}`, data)
      const { floorId: fId, ...rest } = data
      return api.post(`/apartments/floors/${fId}`, rest)
    },
    onSuccess,
  })

  const onSubmit = (data) => mutation.mutate({
    ...data,
    bedrooms: parseInt(data.bedrooms),
    bathrooms: parseInt(data.bathrooms),
    areaSqft: data.areaSqft ? parseFloat(data.areaSqft) : undefined,
    price: data.price ? parseFloat(data.price) : undefined,
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
        <div>
          <label className="label">Unit Number *</label>
          <input className={`input ${errors.unitNumber ? 'border-red-400' : ''}`}
            placeholder="A-1204"
            {...register('unitNumber', { required: 'Required' })} />
        </div>
        <div>
          <label className="label">Apartment Type</label>
          <select className="input" {...register('apartmentTypeId')}>
            <option value="">— Select type —</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Bedrooms *</label>
          <input className="input" type="number" min="0"
            {...register('bedrooms', { required: 'Required', min: 0 })} />
        </div>
        <div>
          <label className="label">Bathrooms *</label>
          <input className="input" type="number" min="1"
            {...register('bathrooms', { required: 'Required', min: 1 })} />
        </div>
        <div>
          <label className="label">Area (sqft)</label>
          <input className="input" type="number" placeholder="1200" {...register('areaSqft')} />
        </div>
        <div>
          <label className="label">Price (LKR)</label>
          <input className="input" type="number" placeholder="35000000" {...register('price')} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" {...register('status')}>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
        </div>
        {!isEdit && (
          <div>
            <label className="label">Floor ID {!floorId && '*'}</label>
            <input className="input" placeholder="Floor ID"
              defaultValue={floorId || ''}
              {...register('floorId', { required: !floorId && 'Required' })} />
            <p className="text-xs text-gray-400 mt-1">Go to Projects → Building → Floor to manage units per floor</p>
          </div>
        )}
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} {...register('description')} />
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <input type="checkbox" id="pub" className="w-4 h-4 accent-gold-500" {...register('isPublished')} />
          <label htmlFor="pub" className="text-sm text-gray-700 cursor-pointer">
            Publish this apartment (visible on website)
          </label>
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Apartment'}
      </button>
    </form>
  )
}
