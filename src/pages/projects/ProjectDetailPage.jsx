import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Pencil, Trash2, ChevronLeft, Building, Layers, Eye, Sparkles,
  Image, Tag, Check, X, AlertCircle, ImagePlus, ShieldCheck,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../../lib/api'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import GeneratedMasterFloorPlan from '../../components/ui/GeneratedMasterFloorPlan'

// ─── Gallery categories (must match backend GalleryCategory enum) ─────────────
const GALLERY_CATEGORIES = ['EXTERIOR', 'INTERIOR', 'COMMON_AREAS', 'AMENITIES', 'SURROUNDINGS', 'OTHER']

const CATEGORY_LABELS = {
  EXTERIOR:     'Exterior',
  INTERIOR:     'Interior',
  COMMON_AREAS: 'Common Areas',
  AMENITIES:    'Amenities',
  SURROUNDINGS: 'Surroundings',
  OTHER:        'Other',
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gold-600" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

// ─── Gallery Section ──────────────────────────────────────────────────────────
function GallerySection({ projectId }) {
  const qc = useQueryClient()
  const [addModal, setAddModal] = useState(false)
  const [activeCategory, setActiveCategory] = useState('ALL')

  const { data: gallery = [], isLoading } = useQuery({
    queryKey: ['project-gallery', projectId],
    queryFn: () =>
      api.get(`/projects/${projectId}/gallery`).then((r) => r.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (imgId) => api.delete(`/admin/gallery/${imgId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-gallery', projectId] }),
  })

  const categories = ['ALL', ...new Set(gallery.map((g) => g.category))]

  const filtered =
    activeCategory === 'ALL'
      ? gallery
      : gallery.filter((g) => g.category === activeCategory)

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4 mb-1">
        <SectionTitle
          icon={Image}
          title="Project Gallery"
          subtitle="Images shown in the Gallery tab on the public project page."
        />
        <button
          className="btn-primary text-sm flex-shrink-0"
          onClick={() => setAddModal(true)}
        >
          <ImagePlus className="w-4 h-4" /> Add Image
        </button>
      </div>

      {/* Category filter */}
      {gallery.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeCategory === cat
                  ? 'bg-navy-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'ALL' ? 'All' : CATEGORY_LABELS[cat] || cat}
              {cat !== 'ALL' && (
                <span className="ml-1 text-gray-400">
                  ({gallery.filter((g) => g.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <p className="text-sm text-gray-400 py-6 text-center">Loading gallery…</p>
      ) : filtered.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-12 text-center">
          <Image className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No images yet. Click "Add Image" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((img) => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              <div className="aspect-video overflow-hidden">
                <img
                  src={img.imageUrl}
                  alt={img.caption || ''}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
                {/* broken-image fallback */}
                <div
                  className="w-full h-full hidden items-center justify-center bg-gray-100"
                  style={{ display: 'none' }}
                >
                  <AlertCircle className="w-5 h-5 text-gray-300" />
                </div>
              </div>

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() =>
                    window.confirm('Delete this image?') &&
                    deleteMutation.mutate(img.id)
                  }
                  className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  title="Delete image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Footer: category badge + caption */}
              <div className="px-2.5 py-2 bg-white border-t border-gray-100">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-gold-600 bg-gold-50 px-1.5 py-0.5 rounded">
                  {CATEGORY_LABELS[img.category] || img.category}
                </span>
                {img.caption && (
                  <p className="text-xs text-gray-500 mt-1 truncate" title={img.caption}>
                    {img.caption}
                  </p>
                )}
                {img.sortOrder !== 0 && (
                  <p className="text-[10px] text-gray-400 mt-0.5">Order: {img.sortOrder}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Image Modal */}
      {addModal && (
        <Modal title="Add Gallery Image" onClose={() => setAddModal(false)}>
          <GalleryImageForm
            projectId={projectId}
            onSuccess={() => {
              setAddModal(false)
              qc.invalidateQueries({ queryKey: ['project-gallery', projectId] })
            }}
          />
        </Modal>
      )}
    </div>
  )
}

function GalleryImageForm({ projectId, onSuccess }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { category: 'EXTERIOR', sortOrder: 0 } })

  const mutation = useMutation({
    mutationFn: (data) =>
      api.post(`/projects/${projectId}/gallery`, {
        ...data,
        sortOrder: parseInt(data.sortOrder) || 0,
      }),
    onSuccess,
  })

  const imageUrl = watch('imageUrl')

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      {mutation.isError && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {mutation.error?.response?.data?.message || 'Something went wrong.'}
        </div>
      )}

      {/* Image URL */}
      <div>
        <label className="label">Image URL *</label>
        <input
          className={`input ${errors.imageUrl ? 'border-red-400' : ''}`}
          placeholder="https://example.com/image.jpg"
          {...register('imageUrl', { required: 'Image URL is required' })}
        />
        {errors.imageUrl && (
          <p className="mt-1 text-xs text-red-500">{errors.imageUrl.message}</p>
        )}
      </div>

      {/* Live preview */}
      {imageUrl && (
        <div className="rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => (e.target.style.opacity = '0')}
          />
        </div>
      )}

      {/* Category */}
      <div>
        <label className="label">Category *</label>
        <select className="input" {...register('category', { required: true })}>
          {GALLERY_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          This controls which filter button shows the image on the website.
        </p>
      </div>

      {/* Caption */}
      <div>
        <label className="label">Caption</label>
        <input
          className="input"
          placeholder="Optional — shown as a label over the image"
          {...register('caption')}
        />
      </div>

      {/* Sort order */}
      <div>
        <label className="label">Sort Order</label>
        <input
          type="number"
          className="input"
          placeholder="0"
          min="0"
          {...register('sortOrder')}
        />
        <p className="text-xs text-gray-400 mt-1">
          Lower numbers appear first. Leave at 0 to append at the end.
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full justify-center"
      >
        {isSubmitting ? 'Adding…' : 'Add to Gallery'}
      </button>
    </form>
  )
}

// ─── Facilities Section ───────────────────────────────────────────────────────
function FacilitiesSection({ projectId, assignedFacilityIds: initialAssigned }) {
  const qc = useQueryClient()
  const [facilityModal, setFacilityModal] = useState(false)   // open/close
  const [editingFacility, setEditingFacility] = useState(null) // null = create, object = edit
  const [selected, setSelected] = useState(new Set(initialAssigned || []))

  const { data: allFacilities = [] } = useQuery({
    queryKey: ['facilities-all'],
    queryFn: () => api.get('/projects/facilities').then((r) => r.data.data),
  })

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const openCreate = () => { setEditingFacility(null); setFacilityModal(true) }
  const openEdit   = (f, e) => { e.stopPropagation(); setEditingFacility(f); setFacilityModal(true) }

  const saveMutation = useMutation({
    mutationFn: () =>
      api.post(`/projects/${projectId}/facilities`, { facilityIds: [...selected] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-detail', projectId] })
    },
  })

  const deleteFacilityMutation = useMutation({
    mutationFn: (fid) => api.delete(`/admin/facilities/${fid}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facilities-all'] }),
  })

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4 mb-1">
        <SectionTitle
          icon={ShieldCheck}
          title="Facilities & Amenities"
          subtitle="Tick the facilities offered by this project. They appear in the Facilities tab on the public page."
        />
        <button className="btn-secondary text-sm flex-shrink-0" onClick={openCreate}>
          <Plus className="w-4 h-4" /> New Facility
        </button>
      </div>

      {allFacilities.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 text-center">
          <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400 mb-3">No facilities defined yet. Create your first one.</p>
          <button className="btn-primary text-sm" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Create Facility
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
            {allFacilities.map((f) => {
              const isChecked = selected.has(f.id)
              return (
                <div
                  key={f.id}
                  onClick={() => toggle(f.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all select-none ${
                    isChecked
                      ? 'border-gold-400 bg-gold-50 shadow-sm'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isChecked ? 'bg-gold-500 border-gold-500' : 'border-gray-300 bg-white'
                  }`}>
                    {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>

                  {/* Icon */}
                  {f.icon && (
                    <span className="text-lg leading-none flex-shrink-0">{f.icon}</span>
                  )}

                  {/* Name + description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{f.name}</p>
                    {f.description && (
                      <p className="text-xs text-gray-400 truncate">{f.description}</p>
                    )}
                  </div>

                  {/* Edit + Delete buttons */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={(e) => openEdit(f, e)}
                      className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                      title="Edit facility"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {!isChecked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.confirm(`Delete "${f.name}"? This removes it from all projects.`) &&
                            deleteFacilityMutation.mutate(f.id)
                        }}
                        className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                        title="Delete facility"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary + Save */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {selected.size === 0
                ? 'No facilities selected'
                : `${selected.size} facilit${selected.size === 1 ? 'y' : 'ies'} selected`}
            </p>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="btn-primary text-sm"
            >
              {saveMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : saveMutation.isSuccess ? (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" /> Saved
                </span>
              ) : (
                'Save Facilities'
              )}
            </button>
          </div>

          {saveMutation.isError && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {saveMutation.error?.response?.data?.message || 'Failed to save. Please try again.'}
            </p>
          )}
        </>
      )}

      {/* Create / Edit Facility Modal */}
      {facilityModal && (
        <Modal
          title={editingFacility ? 'Edit Facility' : 'Create New Facility'}
          onClose={() => setFacilityModal(false)}
        >
          <FacilityForm
            initial={editingFacility}
            onSuccess={(saved) => {
              setFacilityModal(false)
              qc.invalidateQueries({ queryKey: ['facilities-all'] })
              // Auto-select newly created facilities
              if (!editingFacility && saved?.id) {
                setSelected((prev) => new Set([...prev, saved.id]))
              }
            }}
          />
        </Modal>
      )}
    </div>
  )
}

// ─── Facility Form (create + edit) ───────────────────────────────────────────
function FacilityForm({ initial, onSuccess }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: initial || {} })

  const mutation = useMutation({
    mutationFn: (data) =>
      initial
        ? api.put(`/admin/facilities/${initial.id}`, data)
        : api.post('/admin/facilities', data),
    onSuccess: (res) => onSuccess(res.data.data),
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      {mutation.isError && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {mutation.error?.response?.data?.message || 'Something went wrong.'}
        </div>
      )}

      <div>
        <label className="label">Facility Name *</label>
        <input
          className={`input ${errors.name ? 'border-red-400' : ''}`}
          placeholder="e.g. Infinity Pool, Fitness Center, 24/7 Security"
          {...register('name', { required: 'Name is required' })}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="label">Icon</label>
        <input
          className="input"
          placeholder="Paste an emoji — e.g. 🏊 🏋️ 🛡️ 🅿️"
          {...register('icon')}
        />
        <p className="text-xs text-gray-400 mt-1">
          Paste an emoji directly for best results.
        </p>
      </div>

      <div>
        <label className="label">Description</label>
        <input
          className="input"
          placeholder="Short description shown on the website"
          {...register('description')}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full justify-center"
      >
        {isSubmitting
          ? (initial ? 'Saving…' : 'Creating…')
          : (initial ? 'Save Changes' : 'Create Facility')}
      </button>
    </form>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [buildingModal, setBuildingModal] = useState(false)
  const [editBuilding, setEditBuilding] = useState(null)
  const [floorModal, setFloorModal] = useState(null) // buildingId
  const [editFloor, setEditFloor] = useState(null)
  const [previewFloorId, setPreviewFloorId] = useState(null)

  const { data: project, isLoading } = useQuery({
    queryKey: ['project-detail', id],
    queryFn: () =>
      api.get('/projects/admin/all').then((r) => r.data.data.find((p) => p.id === id)),
  })

  const { data: buildings } = useQuery({
    queryKey: ['buildings', id],
    queryFn: () => api.get(`/projects/${id}/buildings`).then((r) => r.data.data),
  })

  const deleteBuildingMutation = useMutation({
    mutationFn: (bid) => api.delete(`/admin/buildings/${bid}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['buildings', id] }),
  })

  const deleteFloorMutation = useMutation({
    mutationFn: (fid) => api.delete(`/admin/floors/${fid}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['buildings', id] }),
  })

  if (isLoading) return <div className="text-gray-400 p-8 text-center">Loading…</div>

  // Extract assigned facility IDs for the Facilities section
  const assignedFacilityIds = (project?.projectFacilities || []).map((pf) => pf.facilityId || pf.facility?.id)

  return (
    <div className="space-y-8">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Projects
      </Link>

      <PageHeader
        title={project?.name || 'Project'}
        subtitle={project?.location}
        action={
          <button
            className="btn-primary"
            onClick={() => { setEditBuilding(null); setBuildingModal(true) }}
          >
            <Plus className="w-4 h-4" /> Add Building
          </button>
        }
      />

      {/* ── Buildings & Floors ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        {!buildings?.length ? (
          <div className="card p-8 text-center text-gray-400">
            No buildings yet. Add the first one.
          </div>
        ) : (
          buildings.map((building) => (
            <div key={building.id} className="card">
              {/* Building header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <Building className="w-5 h-5 text-gold-500" />
                <span className="font-semibold text-gray-900 flex-1">{building.name}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setFloorModal(building.id); setEditFloor(null) }}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    <Plus className="w-3 h-3" /> Floor
                  </button>
                  <button
                    onClick={() => { setEditBuilding(building); setBuildingModal(true) }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      window.confirm('Delete this building?') &&
                      deleteBuildingMutation.mutate(building.id)
                    }
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Floors */}
              <div className="divide-y divide-gray-50">
                {building.floors?.length ? (
                  building.floors.map((floor) => (
                    <div key={floor.id} className="divide-y divide-gray-50">
                      <div className="flex items-center gap-3 px-5 py-3">
                        <Layers className="w-4 h-4 text-gold-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">
                            Floor {floor.floorNumber}
                            {floor.description && (
                              <span className="text-gray-400 font-normal ml-2">
                                — {floor.description}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                            <Sparkles className="w-3 h-3 text-gold-500" /> Auto Master Plan Ready (
                            {floor._count?.apartments ?? 0} units)
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setPreviewFloorId(previewFloorId === floor.id ? null : floor.id)
                          }
                          className={`btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 ${
                            previewFloorId === floor.id ? 'bg-navy-900 text-white' : ''
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          {previewFloorId === floor.id ? 'Hide Plan' : 'Preview Master Plan'}
                        </button>
                        <Link
                          to={`/apartments?floorId=${floor.id}`}
                          className="text-xs text-gold-600 font-medium hover:underline"
                        >
                          Manage units
                        </Link>
                        <button
                          onClick={() => { setFloorModal(building.id); setEditFloor(floor) }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() =>
                            window.confirm('Delete this floor?') &&
                            deleteFloorMutation.mutate(floor.id)
                          }
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Auto Generated Floor Plan Preview */}
                      {previewFloorId === floor.id && (
                        <div className="px-5 py-4 bg-gray-50 border-t border-b border-gray-200">
                          <GeneratedMasterFloorPlan floor={floor} buildingName={building.name} />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="px-5 py-3 text-sm text-gray-400">
                    No floors. Add a floor to start adding units.
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Gallery Management ─────────────────────────────────────────────── */}
      <GallerySection projectId={id} />

      {/* ── Facilities & Amenities ─────────────────────────────────────────── */}
      {project && (
        <FacilitiesSection
          projectId={id}
          assignedFacilityIds={assignedFacilityIds}
        />
      )}

      {/* ── Building Modal ─────────────────────────────────────────────────── */}
      {buildingModal && (
        <Modal
          title={editBuilding ? 'Edit Building' : 'Add Building'}
          onClose={() => setBuildingModal(false)}
        >
          <BuildingForm
            projectId={id}
            initial={editBuilding}
            onSuccess={() => {
              setBuildingModal(false)
              qc.invalidateQueries({ queryKey: ['buildings', id] })
            }}
          />
        </Modal>
      )}

      {/* ── Floor Modal ────────────────────────────────────────────────────── */}
      {floorModal && (
        <Modal
          title={editFloor ? 'Edit Floor' : 'Add Floor'}
          onClose={() => setFloorModal(null)}
        >
          <FloorForm
            buildingId={floorModal}
            initial={editFloor}
            onSuccess={() => {
              setFloorModal(null)
              qc.invalidateQueries({ queryKey: ['buildings', id] })
            }}
          />
        </Modal>
      )}
    </div>
  )
}

// ─── Building Form ────────────────────────────────────────────────────────────
function BuildingForm({ projectId, initial, onSuccess }) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm({ defaultValues: initial || {} })

  const mutation = useMutation({
    mutationFn: (data) =>
      initial
        ? api.put(`/admin/buildings/${initial.id}`, data)
        : api.post(`/projects/${projectId}/buildings`, data),
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
        <label className="label">Building Name *</label>
        <input
          className={`input ${errors.name ? 'border-red-400' : ''}`}
          placeholder="Building A"
          {...register('name', { required: 'Required' })}
        />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={2} {...register('description')} />
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? 'Saving…' : initial ? 'Save Changes' : 'Add Building'}
      </button>
    </form>
  )
}

// ─── Floor Form ───────────────────────────────────────────────────────────────
function FloorForm({ buildingId, initial, onSuccess }) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm({ defaultValues: initial || {} })

  const mutation = useMutation({
    mutationFn: (data) =>
      initial
        ? api.put(`/admin/floors/${initial.id}`, data)
        : api.post(`/admin/buildings/${buildingId}/floors`, data),
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
        <label className="label">Floor Number *</label>
        <input
          className={`input ${errors.floorNumber ? 'border-red-400' : ''}`}
          type="number"
          min="1"
          {...register('floorNumber', { required: 'Required', valueAsNumber: true })}
        />
      </div>
      <div>
        <label className="label">Floor Description</label>
        <input
          className="input"
          placeholder="e.g. Ground Floor, Executive Level, Penthouse Suite"
          {...register('description')}
        />
      </div>
      <div>
        <label className="label">Master Floor Plan Image URL</label>
        <input
          className="input"
          placeholder="https://… image of floor plan for this level"
          {...register('planImageUrl')}
        />
        <p className="text-xs text-gray-400 mt-1">
          Displayed under the Master Plan section on the website for this floor.
        </p>
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? 'Saving…' : initial ? 'Save Changes' : 'Add Floor'}
      </button>
    </form>
  )
}
