import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Search, X, Calendar, Phone, User, Building2 } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'

export default function BrochureDownloadsPage() {
  const [selectedProject, setSelectedProject] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['brochure-downloads', selectedProject],
    queryFn: () =>
      api
        .get('/projects/admin/brochure-downloads', {
          params: selectedProject ? { projectId: selectedProject, limit: 200 } : { limit: 200 },
        })
        .then((r) => r.data),
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects-public'],
    queryFn: () => api.get('/projects/admin/all').then((r) => r.data.data),
  })

  const downloads = data?.data || []
  const projects  = projectsData || []

  // Client-side name/phone search
  const filtered = search.trim()
    ? downloads.filter(
        (d) =>
          d.fullName.toLowerCase().includes(search.toLowerCase()) ||
          d.phone.includes(search)
      )
    : downloads

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    }) + ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      <PageHeader
        title="Brochure Downloads"
        subtitle={`${data?.pagination?.total ?? 0} total download${data?.pagination?.total !== 1 ? 's' : ''}`}
        icon={Download}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 w-full"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Project filter */}
        <select
          className="input w-56"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Clear */}
        {(selectedProject || search) && (
          <button
            onClick={() => { setSelectedProject(''); setSearch('') }}
            className="btn-secondary text-sm text-gray-600 border-gray-200 py-2"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Download className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {search || selectedProject ? 'No results match your filters.' : 'No brochure downloads yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-navy-900 text-white text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Name</span>
                  </th>
                  <th className="px-4 py-3">
                    <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</span>
                  </th>
                  <th className="px-4 py-3">
                    <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Project</span>
                  </th>
                  <th className="px-4 py-3 rounded-tr-lg">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Downloaded</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((d, i) => (
                  <tr key={d.id} className={`hover:bg-gray-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 font-semibold text-gray-900">{d.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{d.phone}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-900/8 text-navy-800 text-xs font-semibold">
                        <Building2 className="w-3 h-3 text-gold-500" />
                        {d.project?.name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(d.downloadedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer count */}
      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-right">
          Showing {filtered.length} of {data?.pagination?.total ?? filtered.length} records
        </p>
      )}
    </div>
  )
}
