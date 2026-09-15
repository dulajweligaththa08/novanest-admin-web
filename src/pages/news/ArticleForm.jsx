import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import api from '../../lib/api'

const CATEGORIES = ['Real Estate', 'Investment', 'Architecture', 'Lifestyle', 'Company News', 'Project News', 'General']

export default function ArticleForm({ initial, onSuccess }) {
  const isEdit = !!initial
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: initial ? {
      title: initial.title,
      category: initial.category,
      author: initial.author || '',
      thumbnail: initial.thumbnail || '',
      excerpt: initial.excerpt || '',
      body: initial.body,
      status: initial.status,
    } : { status: 'DRAFT', category: 'Real Estate' },
  })

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/news/${initial.id}`, data) : api.post('/news', data),
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
        <label className="label">Title *</label>
        <input className={`input ${errors.title ? 'border-red-400' : ''}`}
          {...register('title', { required: 'Required' })} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category</label>
          <select className="input" {...register('category')}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Author</label>
          <input className="input" placeholder="NovaNest Team" {...register('author')} />
        </div>
        <div>
          <label className="label">Thumbnail URL</label>
          <input className="input" placeholder="https://..." {...register('thumbnail')} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" {...register('status')}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Excerpt</label>
        <textarea className="input resize-none" rows={2}
          placeholder="Short description shown in article lists..."
          {...register('excerpt')} />
      </div>

      <div>
        <label className="label">Body *</label>
        <textarea className={`input resize-none ${errors.body ? 'border-red-400' : ''}`}
          rows={10}
          placeholder="Full article content..."
          {...register('body', { required: 'Required' })} />
        <p className="text-xs text-gray-400 mt-1">Markdown or plain text supported.</p>
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Article'}
      </button>
    </form>
  )
}
