import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import api from '../../lib/api'

export default function CustomerForm({ onSuccess }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { sendWelcomeEmail: true },
  })

  const mutation = useMutation({
    mutationFn: (data) => api.post('/admin/customers', data),
    onSuccess,
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      {mutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {mutation.error?.response?.data?.message || 'Something went wrong.'}
        </div>
      )}

      <div>
        <label className="label">Full Name *</label>
        <input className={`input ${errors.fullName ? 'border-red-400' : ''}`}
          placeholder="John Doe"
          {...register('fullName', { required: 'Required' })} />
      </div>
      <div>
        <label className="label">Email Address *</label>
        <input className={`input ${errors.email ? 'border-red-400' : ''}`}
          type="email" placeholder="john@example.com"
          {...register('email', { required: 'Required' })} />
      </div>
      <div>
        <label className="label">Phone</label>
        <input className="input" placeholder="+94 77 000 0000" {...register('phone')} />
      </div>
      <div>
        <label className="label">Temporary Password *</label>
        <input className={`input ${errors.password ? 'border-red-400' : ''}`}
          type="text" placeholder="Minimum 8 characters"
          {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
        <p className="text-xs text-gray-400 mt-1">The customer should change this on first login.</p>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <input type="checkbox" id="sendEmail" className="w-4 h-4 accent-gold-500" {...register('sendWelcomeEmail')} />
        <label htmlFor="sendEmail" className="text-sm text-gray-700 cursor-pointer">
          Send welcome email with login credentials
        </label>
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? 'Creating...' : 'Create Customer Account'}
      </button>
    </form>
  )
}
