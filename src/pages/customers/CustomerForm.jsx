import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import api from '../../lib/api'

export default function CustomerForm({ onSuccess, prefill = {} }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      sendWelcomeEmail: true,
      fullName:  prefill.fullName  || '',
      email:     prefill.email     || '',
      phone:     prefill.phone     || '',
      address:   prefill.address   || '',
      nationalId:prefill.nationalId|| '',
      password:  '',
    },
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

      {/* ── Identity ── */}
      <div>
        <label className="label">Full Name *</label>
        <input className={`input ${errors.fullName ? 'border-red-400' : ''}`}
          placeholder="John Doe"
          {...register('fullName', { required: 'Required' })} />
        {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Email Address *</label>
          <input className={`input ${errors.email ? 'border-red-400' : ''}`}
            type="email" placeholder="john@example.com"
            {...register('email', { required: 'Required' })} />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" placeholder="+94 77 000 0000" {...register('phone')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">National ID / Passport</label>
          <input className="input" placeholder="NIC or passport number"
            {...register('nationalId')} />
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" placeholder="Street address"
            {...register('address')} />
        </div>
      </div>

      {/* ── Login credentials ── */}
      <div className="pt-1 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Login Credentials
        </p>
        <div>
          <label className="label">Temporary Password *</label>
          <input className={`input ${errors.password ? 'border-red-400' : ''}`}
            type="text" placeholder="Minimum 8 characters"
            {...register('password', {
              required: 'Required',
              minLength: { value: 8, message: 'Min 8 characters' },
            })} />
          <p className="text-xs text-gray-400 mt-1">The customer should change this on first login.</p>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" id="sendEmail" className="w-4 h-4 accent-gold-500"
          {...register('sendWelcomeEmail')} />
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
