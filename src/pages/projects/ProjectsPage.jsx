import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Building2, Eye, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import ProjectForm from './ProjectForm'

const statusBadge = {
  UPCOMING:  'badge-draft',
  ONGOING:   'badge-contacted',
  COMPLETED: 'badge-resolved',
}

export default function ProjectsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['projects-admin'],
    queryFn: () => api.get('/projects/admin/all').then((r) => r.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects-admin'] }),
  })

  const handleDelete = (project) => {
    if (confirm(`Delete project "${project.name}"? This will also delete all buildings, floors, and apartments.`)) {
      deleteMutation.mutate(project.id)
    }
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Manage real estate projects and their buildings"
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus className="w-4 h-4" /> New Project
          </button>
        }
      />

      {isLoading ? (
        <div className="card p-8 text-center text-gray-400">Loading...</div>
      ) : !data?.length ? (
        <div className="card">
          <EmptyState
            icon={Building2}
            title="No projects yet"
            description="Create your first project to get started."
            action={
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> New Project
              </button>
            }
          />
        </div>
      ) : (
        <Table>
          <Thead>
            <Th>Project</Th>
            <Th>Location</Th>
            <Th>Status</Th>
            <Th>Published</Th>
            <Th>Buildings</Th>
            <Th></Th>
          </Thead>
          <Tbody>
            {data.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    {p.mainImage
                      ? <img src={p.mainImage} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-gray-400" />
                        </div>
                    }
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      {p.startingPrice && (
                        <p className="text-xs text-gray-500">From LKR {Number(p.startingPrice).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </Td>
                <Td className="text-gray-600">{p.location}</Td>
                <Td><span className={statusBadge[p.status]}>{p.status}</span></Td>
                <Td>
                  {p.isPublished
                    ? <span className="flex items-center gap-1 text-emerald-600 text-xs"><Eye className="w-3 h-3" /> Published</span>
                    : <span className="flex items-center gap-1 text-gray-400 text-xs"><EyeOff className="w-3 h-3" /> Draft</span>
                  }
                </Td>
                <Td>{p._count?.buildings ?? 0}</Td>
                <Td>
                  <div className="flex items-center gap-1 justify-end">
                    <Link
                      to={`/projects/${p.id}`}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                      title="Manage buildings"
                    >
                      <Building2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => { setEditing(p); setShowForm(true) }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {showForm && (
        <Modal
          title={editing ? 'Edit Project' : 'New Project'}
          onClose={() => setShowForm(false)}
          size="lg"
        >
          <ProjectForm
            initial={editing}
            onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['projects-admin'] }) }}
          />
        </Modal>
      )}
    </div>
  )
}
