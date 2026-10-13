import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, ImageIcon, ExternalLink } from 'lucide-react'
import api from '../../lib/api'

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE',     label: 'House' },
  { value: 'LAND',      label: 'Land' },
]

// ─── Floor Plan Manager (shown only when editing an existing apartment) ────────
function FloorPlanManager({ apartmentId }) {
  const qc = useQueryClient()
  const [imageUrl, setImageUrl] = useState('')
  const [caption,  setCaption]  = useState('')
  const [error,    setError]    = useState('')

  // Fetch the apartment's current floor plans
  const { data: aptData } = useQuery({
    queryKey: ['apt-floorplans', apartmentId],
    queryFn: () => api.get(`/apartments/${apartmentId}`).then(r => r.data.data),
    enabled: !!apartmentId,
  })
  const floorPlans = aptData?.floorPlans || []

  const addMutation = useMutation({
    mutationFn: (data) => api.post(`/apartments/${apartmentId}/floor-plans`, data),
    onSuccess: () => {
      setImageUrl('')
      setCaption('')
      setError('')
      qc.invalidateQueries({ queryKey: ['apt-floorplans', apartmentId] })
      qc.invalidateQueries({ queryKey: ['apartments-admin'] })
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to add floor plan.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/apartments/floor-plans/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['apt-floorplans', apartmentId] })
      qc.invalidateQueries({ queryKey: ['apartments-admin'] })
    },
  })

  const handleAdd = () => {
    if (!imageUrl.trim()) { setError('Image URL is required.'); return }
    setError('')
    addMutation.mutate({ imageUrl: imageUrl.trim(), caption: caption.trim() || undefined })
  }

  return (
    <div className="col-span-2 space-y-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1 border-t border-gray-100">
        Floor Plan Images
      </p>
      <p className="text-xs text-gray-400 -mt-2">
        Upload floor plan drawings for this unit. These appear on the public website under
        the <strong>Floor Plans</strong> tab and can be accessed from the Master Plan.
      </p>

      {/* Existing floor plans */}
      {floorPlans.length > 0 && (
        <div className="space-y-2">
          {floorPlans.map((fp) => (
            <div key={fp.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              {/* Thumbnail */}
              <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                <img
                  src={fp.imageUrl}
                  alt={fp.caption || 'Floor plan'}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none' }}
                />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fp.caption || 'Floor Plan'}
                </p>
                <a
                  href={fp.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-gold-600 hover:underline flex items-center gap-1 mt-0.5"
                >
                  <ExternalLink className="w-3 h-3" /> View image
                </a>
              </div>
              {/* Delete */}
              <button
                type="button"
                onClick={() => confirm('Delete this floor plan image?') && deleteMutation.mutate(fp.id)}
                disabled={deleteMutation.isPending}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new floor plan */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
        <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" /> Add Floor Plan Image
        </p>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <div>
            <label className="label text-xs">Image URL *</label>
            <input
              type="url"
              className="input text-sm"
              placeholder="https://res.cloudinary.com/your-cloud/image/upload/floor-plan.jpg"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-400">
              Upload to Cloudinary (or any image host) and paste the URL here.
            </p>
          </div>
          <div>
            <label className="label text-xs">Caption (optional)</label>
            <input
              type="text"
              className="input text-sm"
              placeholder="e.g. 2BR Floor Plan — Type A"
              value={caption}
              onChange={e => setCaption(e.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={addMutation.isPending}
          className="btn-primary text-sm py-2 w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          {addMutation.isPending ? 'Adding...' : 'Add Floor Plan'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export default function ApartmentForm({ initial, types = [], floorId, onSuccess }) {
  const isEdit = !!initial
  const [propertyType] = useState(initial?.propertyType || 'APARTMENT')

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: initial ? {
      unitNumber:      initial.unitNumber,
      propertyType:    initial.propertyType || 'APARTMENT',
      apartmentTypeId: initial.apartmentTypeId || '',
      bedrooms:        initial.bedrooms,
      bathrooms:       initial.bathrooms,
      areaSqft:        initial.areaSqft || '',
      landAreaPerches: initial.landAreaPerches || '',
      landType:        initial.landType || '',
      roadFrontage:    initial.roadFrontage || '',
      price:           initial.price || '',
      status:          initial.status,
      description:     initial.description || '',
      mainImage:       initial.mainImage || '',
      virtualTourUrl:  initial.virtualTourUrl || '',
      isPublished:     initial.isPublished,
    } : {
      propertyType: 'APARTMENT',
      status:       'AVAILABLE',
      bedrooms:     2,
      bathrooms:    2,
      isPublished:  false,
      floorId:      floorId || '',
    },
  })

  const watchedType    = watch('propertyType')
  const currentType    = watchedType || propertyType
  const showBedsBaths  = currentType !== 'LAND'
  const showLandFields = currentType === 'LAND'

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
    bedrooms:        data.bedrooms  !== undefined ? parseInt(data.bedrooms)  : 0,
    bathrooms:       data.bathrooms !== undefined ? parseInt(data.bathrooms) : 0,
    areaSqft:        data.areaSqft        ? parseFloat(data.areaSqft)        : undefined,
    landAreaPerches: data.landAreaPerches ? parseFloat(data.landAreaPerches) : undefined,
    price:           data.price           ? parseFloat(data.price)           : undefined,
    mainImage:       data.mainImage       || undefined,
    virtualTourUrl:  data.virtualTourUrl  || undefined,
    isPublished:     data.isPublished === true || data.isPublished === 'true',
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {mutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {mutation.error?.response?.data?.message || 'Something went wrong.'}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">

        {/* ── Property Type ── */}
        <div className="col-span-2">
          <label className="label">Property Type *</label>
          <div className="flex gap-3">
            {PROPERTY_TYPES.map(({ value, label }) => (
              <label key={value}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2
                  cursor-pointer text-sm font-medium transition-all
                  ${watchedType === value
                    ? 'border-gold-500 bg-gold-50 text-navy-900'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <input type="radio" value={value} className="sr-only" {...register('propertyType')} />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* ── Unit / Listing name ── */}
        <div>
          <label className="label">
            {currentType === 'LAND' ? 'Listing Name *' : 'Unit Number *'}
          </label>
          <input
            className={`input ${errors.unitNumber ? 'border-red-400' : ''}`}
            placeholder={currentType === 'LAND' ? 'e.g. Plot 12, Rajagiriya' : 'e.g. A-1204'}
            {...register('unitNumber', { required: 'Required' })}
          />
        </div>

        {/* ── Apartment Type ── */}
        {!showLandFields && (
          <div>
            <label className="label">Apartment Type</label>
            <select className="input" {...register('apartmentTypeId')}>
              <option value="">— Select type —</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        {/* ── Beds / Baths ── */}
        {showBedsBaths && (
          <>
            <div>
              <label className="label">Bedrooms</label>
              <input className="input" type="number" min="0" {...register('bedrooms')} />
            </div>
            <div>
              <label className="label">Bathrooms</label>
              <input className="input" type="number" min="0" {...register('bathrooms')} />
            </div>
            <div>
              <label className="label">Area (sqft)</label>
              <input className="input" type="number" placeholder="1200" {...register('areaSqft')} />
            </div>
          </>
        )}

        {/* ── Land fields ── */}
        {showLandFields && (
          <>
            <div>
              <label className="label">Land Area (perches)</label>
              <input className="input" type="number" step="0.1" placeholder="e.g. 20"
                {...register('landAreaPerches')} />
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
              <input className="input" placeholder="e.g. 40ft main road frontage"
                {...register('roadFrontage')} />
            </div>
          </>
        )}

        {/* ── Price & Status ── */}
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

        {/* ── Floor ID (create only) ── */}
        {!isEdit && (
          <div className="col-span-2">
            {floorId ? (
              <input type="hidden" value={floorId} {...register('floorId')} />
            ) : (
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
                <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ No Floor Selected</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Go to <strong>Projects → Building → Floor</strong> and click
                  <strong> "Manage units"</strong> to add properties to a specific floor.
                </p>
                <input type="hidden" value="" {...register('floorId')} />
              </div>
            )}
          </div>
        )}

        {/* ── Description ── */}
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} {...register('description')} />
        </div>

        {/* ── Media & Links ── */}
        <div className="col-span-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pt-1 border-t border-gray-100">
            Media & Links
          </p>
        </div>

        <div className="col-span-2">
          <label className="label">Main Image URL</label>
          <input className="input" placeholder="https://example.com/image.jpg"
            {...register('mainImage')} />
          <p className="mt-1 text-xs text-gray-400">
            Cover/hero image for this unit. Upload to Cloudinary and paste the URL.
          </p>
        </div>

        <div className="col-span-2">
          <label className="label">External Link</label>
          <input className="input" placeholder="https://example.com/virtual-tour"
            {...register('virtualTourUrl')} />
          <p className="mt-1 text-xs text-gray-400">
            Virtual tour, 360° view, video walkthrough, or brochure URL.
          </p>
        </div>

        {/* ── Floor Plan Images (edit mode only) ── */}
        {isEdit && <FloorPlanManager apartmentId={initial.id} />}

        {/* ── Publish ── */}
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
        disabled={isSubmitting || (!isEdit && !floorId)}
        className="btn-primary w-full justify-center"
      >
        {isSubmitting
          ? 'Saving...'
          : isEdit
            ? 'Save Changes'
            : `Create ${PROPERTY_TYPES.find(t => t.value === currentType)?.label || 'Listing'}`}
      </button>

      {/* Note shown only on create — floor plans managed after saving */}
      {!isEdit && (
        <p className="text-xs text-gray-400 text-center">
          💡 Floor plan images can be uploaded after creating the unit by clicking the edit (pencil) button.
        </p>
      )}
    </form>
  )
}
