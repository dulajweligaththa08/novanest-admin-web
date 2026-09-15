import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Newspaper, Eye, EyeOff } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import ArticleForm from './ArticleForm'

export default function NewsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['articles-admin', statusFilter],
    queryFn: () => api.get('/news/admin/all', { params: { status: statusFilter, limit: 50 } }).then((r) => r.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/news/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles-admin'] }),
  })

  return (
    <div>
      <PageHeader
        title="News & Insights"
        subtitle="Manage articles and announcements"
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus className="w-4 h-4" /> New Article
          </button>
        }
      />

      <div className="flex gap-1 mb-4">
        {[['', 'All'], ['DRAFT', 'Draft'], ['PUBLISHED', 'Published'], ['ARCHIVED', 'Archived']].map(([v, l]) => (
          <button key={v} onClick={() => setStatusFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${statusFilter === v ? 'bg-navy-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card p-8 text-center text-gray-400">Loading...</div>
      ) : !data?.length ? (
        <div className="card">
          <EmptyState icon={Newspaper} title="No articles yet"
            action={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> New Article</button>}
          />
        </div>
      ) : (
        <Table>
          <Thead>
            <Th>Article</Th>
            <Th>Category</Th>
            <Th>Author</Th>
            <Th>Status</Th>
            <Th>Date</Th>
            <Th></Th>
          </Thead>
          <Tbody>
            {data.map((a) => (
              <Tr key={a.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    {a.thumbnail
                      ? <img src={a.thumbnail} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Newspaper className="w-4 h-4 text-gray-400" />
                        </div>
                    }
                    <p className="font-medium text-gray-900 max-w-xs truncate">{a.title}</p>
                  </div>
                </Td>
                <Td className="text-gray-600">{a.category}</Td>
                <Td className="text-gray-600">{a.author || '—'}</Td>
                <Td>
                  {a.status === 'PUBLISHED'
                    ? <span className="badge-published flex items-center gap-1"><Eye className="w-3 h-3" /> Published</span>
                    : a.status === 'DRAFT'
                      ? <span className="badge-draft flex items-center gap-1"><EyeOff className="w-3 h-3" /> Draft</span>
                      : <span className="badge-closed">{a.status}</span>
                  }
                </Td>
                <Td className="text-xs text-gray-400">
                  {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '—'}
                </Td>
                <Td>
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => { setEditing(a); setShowForm(true) }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => confirm(`Delete "${a.title}"?`) && deleteMutation.mutate(a.id)}
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
        <Modal title={editing ? 'Edit Article' : 'New Article'} onClose={() => setShowForm(false)} size="xl">
          <ArticleForm
            initial={editing}
            onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['articles-admin'] }) }}
          />
        </Modal>
      )}
    </div>
  )
}
