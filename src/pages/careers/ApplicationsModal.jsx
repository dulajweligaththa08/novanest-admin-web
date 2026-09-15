import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '../../components/ui/Modal'
import api from '../../lib/api'

const STATUS_OPTS = ['NEW', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED']

const statusBadge = {
  NEW:        'badge-new',
  REVIEWING:  'badge-contacted',
  SHORTLISTED:'badge-resolved',
  REJECTED:   'badge-closed',
  HIRED:      'badge-published',
}

export default function ApplicationsModal({ job, onClose }) {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['applications', job.id],
    queryFn: () => api.get(`/careers/${job.id}/applications`, { params: { limit: 100 } }).then((r) => r.data.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/careers/applications/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications', job.id] }),
  })

  return (
    <Modal title={`Applications — ${job.title}`} onClose={onClose} size="lg">
      {isLoading ? (
        <div className="py-8 text-center text-gray-400">Loading...</div>
      ) : !data?.length ? (
        <div className="py-8 text-center text-gray-400">No applications yet.</div>
      ) : (
        <div className="space-y-3">
          {data.map((app) => (
            <div key={app.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">{app.fullName}</p>
                  <a href={`mailto:${app.email}`} className="text-sm text-gold-600 hover:underline">{app.email}</a>
                  {app.phone && <p className="text-xs text-gray-400 mt-0.5">{app.phone}</p>}
                </div>
                <select
                  className="input w-36 text-xs py-1.5"
                  value={app.status}
                  onChange={(e) => updateMutation.mutate({ id: app.id, status: e.target.value })}
                >
                  {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {app.coverLetter && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{app.coverLetter}</p>
              )}
              {app.cvUrl && (
                <a href={app.cvUrl} target="_blank" rel="noreferrer"
                  className="text-xs text-gold-600 hover:underline mt-1 inline-block">
                  View CV
                </a>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Applied {new Date(app.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
