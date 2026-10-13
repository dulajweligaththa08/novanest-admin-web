import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import api from '../../lib/api'

export default function ListingForm({ initial, projects = [], onSuccess }) {
  const isEdit = !!initial

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: initial ? {
      listingType:     initial.listingType     || 'HOUSE',
      title:           initial.title           || '',
      location:        initial.location        || '',
      city:            initial.city            || '',
      description:     initial.description     || '',
      projectId:       initial.projectId       || '',
      // House fields
      bedrooms:        initial.bedrooms        ?? '',
      bathrooms:       initial.bathrooms       ?? '',
      areaSqft:        initial.areaSqft        || '',
      storeys:         initial.storeys         ?? '',
      // Land fields
      landAreaPerches: initial.landAreaPerches || '',
      landAreaAcres:   initial.landAreaAcres   || '',
      landType:        initial.landType        || '',
      roadFrontage:    initial.roadFrontage    || '',
      // Common
      price:           initial.price           || '',
      status:          initial.status          || 'AVAILABLE',
      mainImage:       initial.mainImage       || '',
      isPublished:     initial.isPublished     || false,
    } : {
      listingType: 'HOUSE',
      status:      'AVAILABLE',
      isPublished: false,
    },
  })

  const listingType = watch('listingType')
  const isHouse = listingType === 'HOUSE'
  const isLand  = listingType === 'LAND'

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? api.put(`/listings/${initial.id}`, data)
      : api.post('/listings', data),
    onSuccess,
  })

  const onSubmit = (data) => mutation.mutate({
    ...data,
    projectId:       data.projectId       || undefined,
    bedrooms:        data.bedrooms        !== '' ? parseInt(data.bedrooms)          : undefined,
    bathrooms:       data.bathrooms       !== '' ? parseInt(data.bathrooms)         : undefined,
    areaSqft:        data.areaSqft        !== '' ? parseFloat(data.areaSqft)        : undefined,
    storeys:         data.storeys         !== '' ? parseInt(data.storeys)           : undefined,
    landAreaPerches: data.landAreaPerches !== '' ? parseFloat(data.landAreaPerches) : undefined,
    landAreaAcres:   data.landAreaAcres   !== '' ? parseFloat(data.landAreaAcres)   : undefined,
    price:           data.price           !== '' ? parseFloat(data.price)           : undefined,
    isPublished:     data.isPublished === true || data.isPublished === 'true',
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {mutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {mutation.error?.response?.data?.message || 'Something went wrong.'}
        </div>
      )}

      {/* ── Type selector ── */}
      <div>
        <label className="label">Listing Type *</label>
        <div className="flex gap-3">
          {[
            { value: 'HOUSE', label: '🏠 House' },
            { value: 'LAND',  label: '🌿 Land'  },
          ].map(({ value, label }) => (
            <label key={value}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2
                cursor-pointer text-sm font-semibold transition-all
                ${listingType === value
                  ? 'border-gold-500 bg-yellow-50 text-navy-900'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              <input type="radio" value={value} className="sr-only" {...register('listingType')} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Title */}
        <div className="col-span-2">
          <label className="label">Title *</label>
          <input
            className={`input ${errors.title ? 'border-red-400' : ''}`}
            placeholder={isHouse ? 'e.g. 3-Bedroom House in Colombo 05' : 'e.g. Prime Land in Rajagiriya'}
            {...register('title', { required: 'Required' })}
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Location */}
        <div>
          <label className="label">Location / Address *</label>
          <input
            className={`input ${errors.location ? 'border-red-400' : ''}`}
            placeholder="e.g. No. 45, Flower Road"
            {...register('location', { required: 'Required' })}
          />
          {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location.message}</p>}
        </div>

        {/* City */}
        <div>
          <label className="label">City</label>
          <input className="input" placeholder="Colombo" {...register('city')} />
        </div>

        {/* Project (optional) */}
        <div className="col-span-2">
          <label className="label">Associated Project (optional)</label>
          <select className="input" {...register('projectId')}>
            <option value="">— None —</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Link to a project if this listing is part of a development.
          </p>
        </div>

        {/* ── House fields ── */}
        {isHouse && (
          <>
            <div>
              <label className="label">Bedrooms</label>
              <input className="input" type="number" min="0" placeholder="3" {...register('bedrooms')} />
            </div>
            <div>
              <label className="label">Bathrooms</label>
              <input className="input" type="number" min="0" placeholder="2" {...register('bathrooms')} />
            </div>
            <div>
              <label className="label">Floor Area (sqft)</label>
              <input className="input" type="number" placeholder="2400" {...register('areaSqft')} />
            </div>
            <div>
              <label className="label">Storeys</label>
              <input className="input" type="number" min="1" placeholder="2" {...register('storeys')} />
            </div>
          </>
        )}

        {/* ── Land fields ── */}
        {isLand && (
          <>
            <div>
              <label className="label">Land Area (perches)</label>
              <input className="input" type="number" step="0.1" placeholder="20" {...register('landAreaPerches')} />
            </div>
            <div>
              <label className="label">Land Area (acres)</label>
              <input className="input" type="number" step="0.01" placeholder="0.5" {...register('landAreaAcres')} />
            </div>
            <div>
              <label className="label">Land Type</label>
              <select className="input" {...register('landType')}>
                <option value="">— Select —</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Agricultural">Agricultural</option>
                <option value="Industrial">Industrial</option>
                <option value="Mixed Use">Mixed Use</option>
              </select>
            </div>
            <div>
              <label className="label">Road Frontage</label>
              <input className="input" placeholder="e.g. 40ft main road" {...register('roadFrontage')} />
            </div>
          </>
        )}

        {/* Price */}
        <div>
          <label className="label">Price (LKR)</label>
          <input className="input" type="number" placeholder="25000000" {...register('price')} />
        </div>

        {/* Status */}
        <div>
          <label className="label">Status</label>
          <select className="input" {...register('status')}>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
        </div>

        {/* Main image */}
        <div className="col-span-2">
          <label className="label">Main Image URL</label>
          <input className="input" placeholder="https://..." {...register('mainImage')} />
        </div>

        {/* Description */}
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3}
            placeholder="Describe the property..."
            {...register('description')} />
        </div>

        {/* Publish */}
        <div className="col-span-2 flex items-center gap-3">
          <input type="checkbox" id="pub" className="w-4 h-4 accent-gold-500"
            {...register('isPublished')} />
          <label htmlFor="pub" className="text-sm text-gray-700 cursor-pointer">
            Publish this listing (visible on website)
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full justify-center py-3"
      >
        {isSubmitting
          ? 'Saving...'
          : isEdit
            ? 'Save Changes'
            : `Create ${isHouse ? 'House' : 'Land'} Listing`}
      </button>
    </form>
  )
}
