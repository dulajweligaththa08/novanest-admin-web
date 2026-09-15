import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ChevronLeft, Building, Layers } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../../lib/api'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [buildingModal, setBuildingModal] = useState(false)
  const [editBuilding, setEditBuilding] = useState(null)
  const [floorModal, setFloorModal] = useState(null) // buildingId
  const [editFloor, setEditFloor] = useState(null)

  const { data: project, isLoading } = useQuery({
    queryKey: ['project-detail', id],
    queryFn: () => api.get(`/projects/admin/all`).then((r) => r.data.data.find((p) => p.id === id)),
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

  if (isLoading) return <div className="text-gray-400 p-8 text-center">Loading...</div>

  return (
    <div>
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to Projects
      </Link>

      <PageHeader
        title={project?.name || 'Project'}
        subtitle={project?.location}
        action={
          <button className="btn-primary" onClick={() => { setEditBuilding(null); setBuildingModal(true) }}>
            <Plus className="w-4 h-4" /> Add Building
          </button>
        }
      />

      <div className="space-y-4">
        {!buildings?.length ? (
          <div className="card p-8 text-center text-gray-400">No buildings yet. Add the first one.</div>
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
                    onClick={() => confirm('Delete this building?') && deleteBuildingMutation.mutate(building.id)}
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
                    <div key={floor.id} className="flex items-center gap-3 px-5 py-3">
                      <Layers className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 flex-1">
                        Floor {floor.floorNumber}
                        {floor.description && <span className="text-gray-400 ml-2">— {floor.description}</span>}
                      </span>
                      <span className="text-xs text-gray-400">{floor._count?.apartments ?? 0} units</span>
                      <Link
                        to={`/apartments?floorId=${floor.id}`}
                        className="text-xs text-gold-600 hover:underline"
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
                        onClick={() => confirm('Delete this floor?') && deleteFloorMutation.mutate(floor.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="px-5 py-3 text-sm text-gray-400">No floors. Add a floor to start adding units.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Building modal */}
      {buildingModal && (
        <Modal title={editBuilding ? 'Edit Building' : 'Add Building'} onClose={() => setBuildingModal(false)}>
          <BuildingForm
            projectId={id}
            initial={editBuilding}
            onSuccess={() => { setBuildingModal(false); qc.invalidateQueries({ queryKey: ['buildings', id] }) }}
          />
        </Modal>
      )}

      {/* Floor modal */}
      {floorModal && (
        <Modal title={editFloor ? 'Edit Floor' : 'Add Floor'} onClose={() => setFloorModal(null)}>
          <FloorForm
            buildingId={floorModal}
            initial={editFloor}
            onSuccess={() => { setFloorModal(null); qc.invalidateQueries({ queryKey: ['buildings', id] }) }}
          />
        </Modal>
      )}
    </div>
  )
}

function BuildingForm({ projectId, initial, onSuccess }) {
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm({
    defaultValues: initial || {},
  })
  const mutation = useMutation({
    mutationFn: (data) => initial
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
        <input className={`input ${errors.name ? 'border-red-400' : ''}`}
          placeholder="Building A"
          {...register('name', { required: 'Required' })} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={2} {...register('description')} />
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? 'Saving...' : initial ? 'Save Changes' : 'Add Building'}
      </button>
    </form>
  )
}

function FloorForm({ buildingId, initial, onSuccess }) {
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm({
    defaultValues: initial || {},
  })
  const mutation = useMutation({
    mutationFn: (data) => initial
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
        <input className={`input ${errors.floorNumber ? 'border-red-400' : ''}`}
          type="number" min="1"
          {...register('floorNumber', { required: 'Required', valueAsNumber: true })} />
      </div>
      <div>
        <label className="label">Description</label>
        <input className="input" placeholder="e.g. High-rise floor" {...register('description')} />
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? 'Saving...' : initial ? 'Save Changes' : 'Add Floor'}
      </button>
    </form>
  )
}
