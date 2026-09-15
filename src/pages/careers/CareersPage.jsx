import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Briefcase, Users } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import JobForm from './JobForm'
import ApplicationsModal from './ApplicationsModal'

export default function CareersPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewApps, setViewApps] = useState(null) // job

  const { data, isLoading } = useQuery({
    queryKey: ['jobs-admin'],
    queryFn: () => api.get('/careers/admin/all').then((r) => r.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/careers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs-admin'] }),
  })

  return (
    <div>
      <PageHeader
        title="Careers"
        subtitle="Manage job listings and applications"
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus className="w-4 h-4" /> New Job
          </button>
        }
      />

      {isLoading ? (
        <div className="card p-8 text-center text-gray-400">Loading...</div>
      ) : !data?.length ? (
        <div className="card">
          <EmptyState icon={Briefcase} title="No jobs yet"
            action={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> New Job</button>}
          />
        </div>
      ) : (
        <Table>
          <Thead>
            <Th>Position</Th>
            <Th>Department</Th>
            <Th>Location</Th>
            <Th>Type</Th>
            <Th>Status</Th>
            <Th>Applications</Th>
            <Th></Th>
          </Thead>
          <Tbody>
            {data.map((job) => (
              <Tr key={job.id}>
                <Td className="font-medium text-gray-900">{job.title}</Td>
                <Td className="text-gray-600">{job.department}</Td>
                <Td className="text-gray-600">{job.location}</Td>
                <Td className="text-gray-600">{job.type}</Td>
                <Td>
                  <span className={job.status === 'OPEN' ? 'badge-resolved' : 'badge-closed'}>
                    {job.status}
                  </span>
                </Td>
                <Td>
                  <button
                    onClick={() => setViewApps(job)}
                    className="flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700 font-medium"
                  >
                    <Users className="w-3.5 h-3.5" />
                    {job._count?.applications ?? 0}
                  </button>
                </Td>
                <Td>
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => { setEditing(job); setShowForm(true) }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => confirm(`Delete "${job.title}"?`) && deleteMutation.mutate(job.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600">
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
        <Modal title={editing ? 'Edit Job' : 'New Job'} onClose={() => setShowForm(false)} size="lg">
          <JobForm
            initial={editing}
            onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['jobs-admin'] }) }}
          />
        </Modal>
      )}

      {viewApps && (
        <ApplicationsModal job={viewApps} onClose={() => setViewApps(null)} />
      )}
    </div>
  )
}
