import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import {
  ChevronLeft, Plus, Home, FileText, Bell, KeyRound,
  Pencil, CheckCircle, ClipboardList, ArrowRight, Save,
  ChevronDown, ChevronUp, CreditCard, HardHat, Key,
  Megaphone, ClipboardCheck, MessageCircle, Trash2,
  DollarSign, CalendarClock, BadgeCheck, AlertCircle,
} from 'lucide-react'
import api from '../../lib/api'
import Modal from '../../components/ui/Modal'
import DocumentForm from './DocumentForm'
import AssignApartmentForm from './AssignApartmentForm'

// ─── Update category config ───────────────────────────────────────────────────
const UPDATE_CATEGORIES = [
  {
    type:       'BOOKING_CONFIRMATION',
    label:      'Booking Confirmation',
    icon:       CheckCircle,
    iconBg:     'bg-emerald-100',
    iconColor:  'text-emerald-600',
    headerBg:   'bg-emerald-50',
    headerText: 'text-emerald-800',
    border:     'border-l-emerald-400',
  },
  {
    type:       'PAYMENT_UPDATE',
    label:      'Payment Update',
    icon:       CreditCard,
    iconBg:     'bg-blue-100',
    iconColor:  'text-blue-600',
    headerBg:   'bg-blue-50',
    headerText: 'text-blue-800',
    border:     'border-l-blue-400',
    hasPaymentPlan: true,           // ← special flag
  },
  {
    type:       'CONSTRUCTION_PROGRESS',
    label:      'Construction Progress',
    icon:       HardHat,
    iconBg:     'bg-amber-100',
    iconColor:  'text-amber-600',
    headerBg:   'bg-amber-50',
    headerText: 'text-amber-800',
    border:     'border-l-amber-400',
  },
  {
    type:       'APARTMENT_COMPLETION',
    label:      'Apartment Completion',
    icon:       Home,
    iconBg:     'bg-purple-100',
    iconColor:  'text-purple-600',
    headerBg:   'bg-purple-50',
    headerText: 'text-purple-800',
    border:     'border-l-purple-400',
  },
  {
    type:       'HANDOVER_INFORMATION',
    label:      'Handover Information',
    icon:       Key,
    iconBg:     'bg-yellow-100',
    iconColor:  'text-yellow-600',
    headerBg:   'bg-yellow-50',
    headerText: 'text-yellow-800',
    border:     'border-l-yellow-400',
  },
  {
    type:       'IMPORTANT_ANNOUNCEMENT',
    label:      'Announcement',
    icon:       Megaphone,
    iconBg:     'bg-red-100',
    iconColor:  'text-red-600',
    headerBg:   'bg-red-50',
    headerText: 'text-red-800',
    border:     'border-l-red-400',
  },
  {
    type:       'INSPECTION_UPDATE',
    label:      'Inspection Update',
    icon:       ClipboardCheck,
    iconBg:     'bg-cyan-100',
    iconColor:  'text-cyan-600',
    headerBg:   'bg-cyan-50',
    headerText: 'text-cyan-800',
    border:     'border-l-cyan-400',
  },
  {
    type:       'DOCUMENT_UPDATE',
    label:      'Document Update',
    icon:       FileText,
    iconBg:     'bg-indigo-100',
    iconColor:  'text-indigo-600',
    headerBg:   'bg-indigo-50',
    headerText: 'text-indigo-800',
    border:     'border-l-indigo-400',
  },
  {
    type:       'GENERAL',
    label:      'General Update',
    icon:       MessageCircle,
    iconBg:     'bg-gray-100',
    iconColor:  'text-gray-500',
    headerBg:   'bg-gray-50',
    headerText: 'text-gray-700',
    border:     'border-l-gray-300',
  },
]

// ─── Quick Publish form for a single category ─────────────────────────────────
function QuickPublishForm({ assignmentId, updateType, onSuccess }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()
  const mutation = useMutation({
    mutationFn: (data) => api.post(`/admin/assignments/${assignmentId}/updates`, {
      ...data,
      updateType,
    }),
    onSuccess: () => { reset(); onSuccess() },
  })
  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3 pt-3 border-t border-gray-100">
      {mutation.isError && (
        <p className="text-xs text-red-600">{mutation.error?.response?.data?.message || 'Error'}</p>
      )}
      <div>
        <label className="label text-xs">Title *</label>
        <input className={`input text-sm ${errors.title ? 'border-red-400' : ''}`}
          placeholder="Short title..."
          {...register('title', { required: 'Required' })} />
      </div>
      <div>
        <label className="label text-xs">Description *</label>
        <textarea className={`input resize-none text-sm ${errors.description ? 'border-red-400' : ''}`}
          rows={3} placeholder="Details..."
          {...register('description', { required: 'Required' })} />
      </div>
      <button type="submit" disabled={isSubmitting}
        className="btn-primary text-xs py-2 w-full justify-center">
        {isSubmitting ? 'Publishing...' : 'Publish Update'}
      </button>
    </form>
  )
}

// ─── Payment Plan Form ─────────────────────────────────────────────────────────
function PaymentPlanForm({ assignmentId, existingInstalments = [], agreedPrice, onSuccess }) {
  const qc = useQueryClient()

  // ── Payment type: 'lump_sum' | 'instalment' ──────────────────────────────────
  const [paymentType, setPaymentType] = useState(
    existingInstalments.length === 1 ? 'lump_sum' : existingInstalments.length > 1 ? 'instalment' : 'lump_sum'
  )

  // ── Generator state (instalment plan builder) ─────────────────────────────────
  const [genCount,     setGenCount]     = useState(existingInstalments.length > 1 ? existingInstalments.length : 4)
  const [genFrequency, setGenFrequency] = useState('monthly')   // weekly | monthly | quarterly | custom
  const [genStartDate, setGenStartDate] = useState('')
  const [genTotal,     setGenTotal]     = useState(agreedPrice ? String(agreedPrice) : '')
  const [genDesc,      setGenDesc]      = useState('Instalment')

  const { control, register, handleSubmit, watch, setValue, reset,
    formState: { isSubmitting } } = useForm({
    defaultValues: {
      instalments: existingInstalments.length > 0
        ? existingInstalments.map(i => ({
            instalmentNumber: i.instalmentNumber,
            description:      i.description,
            dueDate:          i.dueDate ? new Date(i.dueDate).toISOString().split('T')[0] : '',
            amount:           i.amount,
            isPaid:           i.isPaid,
            paidDate:         i.paidDate ? new Date(i.paidDate).toISOString().split('T')[0] : '',
            notes:            i.notes || '',
          }))
        : [{ instalmentNumber: 1, description: 'Full Payment', dueDate: '', amount: agreedPrice || '', isPaid: false, paidDate: '', notes: '' }],
    },
  })

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'instalments' })

  // ── Generate schedule from builder ────────────────────────────────────────────
  const generateSchedule = () => {
    if (!genStartDate || !genTotal || !genCount) return
    const total    = parseFloat(genTotal)
    const perInst  = parseFloat((total / genCount).toFixed(2))
    const lastAmt  = parseFloat((total - perInst * (genCount - 1)).toFixed(2))
    const start    = new Date(genStartDate)

    const newInstalments = Array.from({ length: genCount }, (_, i) => {
      const due = new Date(start)
      if (genFrequency === 'weekly')     due.setDate(start.getDate()   + i * 7)
      else if (genFrequency === 'monthly') due.setMonth(start.getMonth() + i)
      else if (genFrequency === 'quarterly') due.setMonth(start.getMonth() + i * 3)
      else due.setMonth(start.getMonth() + i)  // custom fallback = monthly

      return {
        instalmentNumber: i + 1,
        description:      `${genDesc} ${i + 1}`,
        dueDate:          due.toISOString().split('T')[0],
        amount:           i === genCount - 1 ? lastAmt : perInst,
        isPaid:           false,
        paidDate:         '',
        notes:            '',
      }
    })
    replace(newInstalments)
  }

  const saveMutation = useMutation({
    mutationFn: (data) => api.post(`/admin/assignments/${assignmentId}/payment-plan`, data),
    onSuccess: () => { onSuccess(); qc.invalidateQueries() },
  })

  const markPaidMutation = useMutation({
    mutationFn: ({ id, paidDate }) => api.put(`/admin/instalments/${id}/mark-paid`, { paidDate }),
    onSuccess: () => { onSuccess(); qc.invalidateQueries() },
  })

  const markUnpaidMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/instalments/${id}/mark-unpaid`),
    onSuccess: () => { onSuccess(); qc.invalidateQueries() },
  })

  const onSubmit = (data) => {
    const clean = data.instalments.map((inst, i) => ({
      instalmentNumber: i + 1,
      description:      inst.description || `Payment ${i + 1}`,
      dueDate:          inst.dueDate,
      amount:           parseFloat(inst.amount),
      isPaid:           inst.isPaid === true || inst.isPaid === 'true',
      paidDate:         inst.paidDate || null,
      notes:            inst.notes || null,
    }))
    saveMutation.mutate({ instalments: clean })
  }

  const instalments = watch('instalments')
  const totalAmount = instalments.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const paidAmount  = instalments.filter(i => i.isPaid).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const paidCount   = instalments.filter(i => i.isPaid).length

  const FREQ_OPTIONS = [
    { value: 'weekly',     label: 'Weekly' },
    { value: 'monthly',    label: 'Monthly' },
    { value: 'quarterly',  label: 'Quarterly (every 3 months)' },
    { value: 'custom',     label: 'Custom (edit manually)' },
  ]

  return (
    <div className="space-y-5">

      {/* ── Payment type selector ── */}
      <div>
        <label className="label">Payment Type</label>
        <div className="flex gap-3">
          {[
            { value: 'lump_sum',    label: '💰 Lump Sum',        desc: 'Single full payment' },
            { value: 'instalment',  label: '📅 Instalment Plan',  desc: 'Multiple scheduled payments' },
          ].map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setPaymentType(value)
                if (value === 'lump_sum') {
                  replace([{
                    instalmentNumber: 1,
                    description: 'Full Payment',
                    dueDate: '',
                    amount: agreedPrice || '',
                    isPaid: false, paidDate: '', notes: '',
                  }])
                }
              }}
              className={`flex-1 p-3 rounded-xl border-2 text-left transition-all
                ${paymentType === value
                  ? 'border-gold-500 bg-gold-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <p className={`text-sm font-semibold ${paymentType === value ? 'text-navy-900' : 'text-gray-700'}`}>
                {label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Instalment plan generator ── */}
      {paymentType === 'instalment' && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            📐 Auto-generate Schedule
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Total Amount (LKR)</label>
              <input className="input text-sm" type="number"
                placeholder={agreedPrice || '35000000'}
                value={genTotal}
                onChange={e => setGenTotal(e.target.value)} />
            </div>
            <div>
              <label className="label text-xs">Number of Instalments</label>
              <input className="input text-sm" type="number" min="2" max="60"
                value={genCount}
                onChange={e => setGenCount(parseInt(e.target.value) || 2)} />
            </div>
            <div>
              <label className="label text-xs">First Payment Date</label>
              <input className="input text-sm" type="date"
                value={genStartDate}
                onChange={e => setGenStartDate(e.target.value)} />
            </div>
            <div>
              <label className="label text-xs">Payment Frequency</label>
              <select className="input text-sm" value={genFrequency}
                onChange={e => setGenFrequency(e.target.value)}>
                {FREQ_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label text-xs">Description Prefix</label>
              <input className="input text-sm" placeholder="e.g. Monthly Payment, Phase"
                value={genDesc}
                onChange={e => setGenDesc(e.target.value)} />
            </div>
          </div>

          {genCount >= 2 && genTotal && genStartDate && (
            <div className="p-3 bg-white rounded-lg border border-blue-200 text-xs text-blue-700 space-y-0.5">
              <p className="font-semibold">Preview:</p>
              <p>
                {genCount} payments of approx.{' '}
                <strong>LKR {Math.floor(parseFloat(genTotal) / genCount).toLocaleString()}</strong>{' '}
                {genFrequency === 'weekly' ? 'per week'
                  : genFrequency === 'monthly' ? 'per month'
                  : genFrequency === 'quarterly' ? 'every 3 months'
                  : '(custom intervals)'}
              </p>
              <p className="text-blue-500">Last instalment adjusted to balance the total.</p>
            </div>
          )}

          <button type="button" onClick={generateSchedule}
            disabled={!genStartDate || !genTotal || genCount < 2}
            className="btn-primary text-xs py-2 w-full justify-center disabled:opacity-40">
            <CalendarClock className="w-3.5 h-3.5" /> Generate Schedule
          </button>
        </div>
      )}

      {/* ── Summary strip ── */}
      {existingInstalments.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total',   value: `LKR ${totalAmount.toLocaleString()}`,               color: 'text-navy-900' },
            { label: 'Paid',    value: `LKR ${paidAmount.toLocaleString()} (${paidCount})`, color: 'text-emerald-600' },
            { label: 'Balance', value: `LKR ${(totalAmount - paidAmount).toLocaleString()}`, color: 'text-blue-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-3 bg-gray-50 rounded-xl text-center border border-gray-100">
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className={`text-sm font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {(saveMutation.isError || markPaidMutation.isError) && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl">
          {saveMutation.error?.response?.data?.message ||
           markPaidMutation.error?.response?.data?.message || 'Error'}
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Payment plan saved — customer notified.
        </div>
      )}

      {/* ── Instalment editor ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-3">
          {fields.map((field, idx) => {
            const existing     = existingInstalments[idx]
            const isAlreadyPaid = existing?.isPaid
            return (
              <div key={field.id}
                className={`p-4 rounded-xl border space-y-3
                  ${isAlreadyPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>

                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${isAlreadyPaid ? 'bg-emerald-500 text-white' : 'bg-navy-900 text-white'}`}>
                    {idx + 1}
                  </span>
                  <input className="input flex-1 text-sm"
                    placeholder="e.g. 10% Down Payment"
                    {...register(`instalments.${idx}.description`)} />
                  {!isAlreadyPaid && (
                    <button type="button" onClick={() => remove(idx)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-xs">Due Date *</label>
                    <input className="input text-sm" type="date"
                      readOnly={isAlreadyPaid}
                      {...register(`instalments.${idx}.dueDate`)} />
                  </div>
                  <div>
                    <label className="label text-xs">Amount (LKR) *</label>
                    <input className="input text-sm" type="number" placeholder="0"
                      readOnly={isAlreadyPaid}
                      {...register(`instalments.${idx}.amount`)} />
                  </div>
                </div>

                {isAlreadyPaid ? (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <BadgeCheck className="w-4 h-4" />
                      Paid{existing.paidDate ? ` on ${new Date(existing.paidDate).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}` : ''}
                    </span>
                    <button type="button"
                      onClick={() => confirm('Mark as unpaid?') && markUnpaidMutation.mutate(existing.id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                      Undo →
                    </button>
                  </div>
                ) : existing?.id ? (
                  <div className="flex items-center gap-2">
                    <input type="date" className="input text-xs flex-1"
                      id={`paidDate-${existing.id}`} />
                    <button type="button"
                      onClick={() => {
                        const d = document.getElementById(`paidDate-${existing.id}`)?.value
                        markPaidMutation.mutate({ id: existing.id, paidDate: d || null })
                      }}
                      className="btn-primary text-xs py-1.5 px-3 gap-1 flex-shrink-0">
                      <BadgeCheck className="w-3.5 h-3.5" /> Mark Paid
                    </button>
                  </div>
                ) : null}

                <input className="input text-xs text-gray-500"
                  placeholder="Internal notes (optional)..."
                  {...register(`instalments.${idx}.notes`)} />
              </div>
            )
          })}
        </div>

        {/* Add instalment manually */}
        <button type="button"
          onClick={() => append({
            instalmentNumber: fields.length + 1,
            description: '', dueDate: '', amount: '',
            isPaid: false, paidDate: '', notes: '',
          })}
          className="btn-secondary w-full justify-center text-sm">
          <Plus className="w-4 h-4" /> Add Instalment Manually
        </button>

        <button type="submit" disabled={isSubmitting}
          className="btn-primary w-full justify-center py-2.5">
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving...' : 'Save Payment Plan & Notify Customer'}
        </button>
      </form>
    </div>
  )
}

// ─── Update Category Section ───────────────────────────────────────────────────
function UpdateCategorySection({ cat, updates, assignment, onRefresh }) {
  const [open,       setOpen]       = useState(false)
  const [showPublish,setShowPublish] = useState(false)
  const [showPlan,   setShowPlan]   = useState(false)

  const Icon = cat.icon
  const count = updates.length
  const existingInstalments = assignment.paymentInstalments || []

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 ${cat.headerBg} hover:brightness-[0.97] transition-all`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.iconBg}`}>
          <Icon className={`w-4 h-4 ${cat.iconColor}`} />
        </div>
        <span className={`flex-1 text-left text-sm font-bold ${cat.headerText}`}>{cat.label}</span>
        <span className="text-xs text-gray-400 mr-1">
          {count} {count === 1 ? 'update' : 'updates'}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
               : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {/* Content */}
      {open && (
        <div className="p-4 bg-white space-y-3">
          {/* Existing updates */}
          {updates.length > 0 && (
            <div className="space-y-2">
              {updates.map(u => (
                <div key={u.id}
                  className={`flex gap-3 p-3 bg-gray-50 rounded-xl border-l-4 ${cat.border}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{u.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{u.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(u.publishedAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payment Plan section for PAYMENT_UPDATE */}
          {cat.hasPaymentPlan && (
            <div>
              <button
                onClick={() => setShowPlan(o => !o)}
                className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors mb-2">
                <DollarSign className="w-4 h-4" />
                {existingInstalments.length > 0
                  ? `Manage Payment Plan (${existingInstalments.length} instalments)`
                  : 'Create Payment Plan'}
                {showPlan ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showPlan && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <PaymentPlanForm
                    assignmentId={assignment.id}
                    existingInstalments={existingInstalments}
                    agreedPrice={assignment.agreedPrice}
                    onSuccess={() => { setShowPlan(false); onRefresh() }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Publish update button + inline form */}
          <div>
            <button
              onClick={() => setShowPublish(o => !o)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-navy-900 transition-colors">
              <Plus className="w-4 h-4" />
              Publish {cat.label} Update
              {showPublish ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showPublish && (
              <QuickPublishForm
                assignmentId={assignment.id}
                updateType={cat.type}
                onSuccess={() => { setShowPublish(false); onRefresh() }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Edit Profile ─────────────────────────────────────────────────────────────
function EditProfileForm({ customer, onSuccess }) {
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm({
    defaultValues: {
      fullName:   customer.fullName   || '',
      phone:      customer.phone      || '',
      address:    customer.address    || '',
      nationalId: customer.nationalId || '',
    },
  })
  const mutation = useMutation({
    mutationFn: (data) => api.put(`/admin/customers/${customer.id}`, data),
    onSuccess,
  })
  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      {mutation.isError && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl">
          {mutation.error?.response?.data?.message || 'Error saving.'}
        </div>
      )}
      {mutation.isSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Profile updated.
        </div>
      )}
      <div>
        <label className="label">Full Name *</label>
        <input className={`input ${errors.fullName ? 'border-red-400' : ''}`}
          {...register('fullName', { required: 'Required' })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Phone</label>
          <input className="input" placeholder="+94 77 000 0000" {...register('phone')} />
        </div>
        <div>
          <label className="label">National ID / Passport</label>
          <input className="input" placeholder="NIC or passport" {...register('nationalId')} />
        </div>
      </div>
      <div>
        <label className="label">Address</label>
        <input className="input" placeholder="Street address" {...register('address')} />
      </div>
      <button type="submit" disabled={isSubmitting || !isDirty} className="btn-primary w-full justify-center">
        <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}

// ─── Purchase Process Form ────────────────────────────────────────────────────
function PurchaseProcessForm({ assignment, onSuccess }) {
  const apt     = assignment.apartment
  const project = apt?.floor?.building?.project
  const { register, handleSubmit, formState: { isSubmitting, isDirty } } = useForm({
    defaultValues: {
      nextSteps:       assignment.nextSteps       || '',
      purchaseProcess: assignment.purchaseProcess || '',
      bookingDate:     assignment.bookingDate
        ? new Date(assignment.bookingDate).toISOString().split('T')[0] : '',
      agreedPrice:     assignment.agreedPrice || '',
      notes:           assignment.notes       || '',
    },
  })
  const mutation = useMutation({
    mutationFn: (data) => api.put(`/admin/assignments/${assignment.id}`, data),
    onSuccess,
  })
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 bg-navy-900/5 rounded-xl border border-navy-900/10">
        <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center flex-shrink-0">
          <Home className="w-4 h-4 text-gold-400" />
        </div>
        <div>
          <p className="font-bold text-navy-900 text-sm">
            {apt?.propertyType === 'LAND' ? apt?.unitNumber : `Unit ${apt?.unitNumber}`}
          </p>
          <p className="text-xs text-gray-500">{project?.name}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {mutation.isError && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl">
            {mutation.error?.response?.data?.message || 'Error saving.'}
          </div>
        )}
        {mutation.isSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Saved — visible to customer.
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Booking Date</label>
            <input className="input" type="date" {...register('bookingDate')} />
          </div>
          <div>
            <label className="label">Agreed Price (LKR)</label>
            <input className="input" type="number" placeholder="35000000" {...register('agreedPrice')} />
          </div>
        </div>
        <div>
          <label className="label">Internal Notes</label>
          <textarea className="input resize-none" rows={2}
            placeholder="Internal notes (not visible to customer)..." {...register('notes')} />
        </div>
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Customer-Facing</p>
        </div>
        <div>
          <label className="label flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-gold-500" /> Next Steps
          </label>
          <textarea className="input resize-none" rows={4}
            placeholder="What the customer needs to do next..."
            {...register('nextSteps')} />
        </div>
        <div>
          <label className="label flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5 text-gold-500" /> Purchase Process Overview
          </label>
          <textarea className="input resize-none" rows={6}
            placeholder="Full phase-by-phase roadmap..."
            {...register('purchaseProcess')} />
        </div>
        <button type="submit" disabled={isSubmitting || !isDirty} className="btn-primary w-full justify-center">
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving...' : 'Save & Publish to Customer'}
        </button>
      </form>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CustomerDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()

  const [showAssign,   setShowAssign]   = useState(false)
  const [showDocument, setShowDocument] = useState(null)
  const [showReset,    setShowReset]    = useState(false)
  const [showEdit,     setShowEdit]     = useState(false)
  const [processAssignmentId, setProcessAssignmentId] = useState(null)

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get(`/admin/customers/${id}`).then((r) => r.data.data),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['customer', id] })

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading...</div>
  if (!customer) return <div className="p-8 text-center text-gray-400">Customer not found.</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/customers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft className="w-4 h-4" /> Back to Customers
      </Link>

      {/* ── Profile card ── */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-navy-900 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">{customer.fullName?.[0]}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{customer.fullName}</h2>
              <p className="text-sm text-gray-500">{customer.user?.email}</p>
              {customer.phone      && <p className="text-sm text-gray-500">{customer.phone}</p>}
              {customer.nationalId && <p className="text-xs text-gray-400 mt-0.5">NIC: {customer.nationalId}</p>}
              {customer.address    && <p className="text-xs text-gray-400">{customer.address}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm">
              <Pencil className="w-4 h-4" /> Edit Profile
            </button>
            <button onClick={() => setShowReset(true)} className="btn-secondary text-sm">
              <KeyRound className="w-4 h-4" /> Reset Password
            </button>
            <span className={`self-center ${customer.user?.isActive ? 'badge-resolved' : 'badge-closed'}`}>
              {customer.user?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Property assignments ── */}
      {customer.customerApartments?.length > 0 ? (
        customer.customerApartments.map((assignment) => {
          const apt     = assignment.apartment
          const project = apt?.floor?.building?.project

          // Group updates by type
          const updatesByType = (assignment.updates || []).reduce((acc, u) => {
            const k = u.updateType || 'GENERAL'
            if (!acc[k]) acc[k] = []
            acc[k].push(u)
            return acc
          }, {})

          return (
            <div key={assignment.id} className="card">
              {/* Assignment header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Home className="w-4 h-4 text-gold-500" />
                  {apt?.propertyType === 'LAND' ? apt?.unitNumber : `Unit ${apt?.unitNumber}`}
                  {project && <span className="text-gray-400 font-normal text-sm">— {project.name}</span>}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setProcessAssignmentId(assignment.id)}
                    className="btn-primary text-xs py-1.5 px-3 gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" /> Purchase Process
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Unit summary */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-400">
                      {apt?.propertyType === 'LAND'
                        ? `${apt?.landAreaPerches ? `${apt.landAreaPerches} perches` : ''}${apt?.landType ? ` · ${apt.landType}` : ''}`
                        : `Floor ${apt?.floor?.floorNumber} · ${apt?.bedrooms}BR / ${apt?.bathrooms}BA${apt?.areaSqft ? ` · ${Number(apt.areaSqft).toLocaleString()} sqft` : ''}`}
                    </p>
                    {assignment.bookingDate && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Booked: {new Date(assignment.bookingDate).toLocaleDateString()}
                      </p>
                    )}
                    {assignment.agreedPrice && (
                      <p className="text-sm font-semibold text-gold-600 mt-1">
                        LKR {Number(assignment.agreedPrice).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className={`badge-${apt?.status?.toLowerCase()}`}>{apt?.status}</span>
                </div>

                {/* ── Categorised Updates ── */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <Bell className="w-4 h-4" /> Updates by Category
                  </h4>
                  <div className="space-y-2">
                    {UPDATE_CATEGORIES.map(cat => (
                      <UpdateCategorySection
                        key={cat.type}
                        cat={cat}
                        updates={updatesByType[cat.type] || []}
                        assignment={assignment}
                        onRefresh={invalidate}
                      />
                    ))}
                  </div>
                </div>

                {/* ── Documents ── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Documents
                    </h4>
                    <button className="btn-secondary text-xs py-1.5 px-3"
                      onClick={() => setShowDocument(assignment.id)}>
                      <Plus className="w-3 h-3" /> Upload Document
                    </button>
                  </div>
                  {assignment.documents?.length ? (
                    <div className="space-y-2">
                      {assignment.documents.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <FileText className="w-4 h-4 text-gold-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
                            <p className="text-xs text-gray-400">{d.documentType}</p>
                          </div>
                          <a href={d.fileUrl} target="_blank" rel="noreferrer"
                            className="text-xs text-gold-600 hover:underline flex-shrink-0">View</a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No documents yet.</p>
                  )}
                </div>
              </div>
            </div>
          )
        })
      ) : (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Home className="w-4 h-4 text-gold-500" /> Property
            </h3>
            <button className="btn-secondary text-sm" onClick={() => setShowAssign(true)}>
              <Plus className="w-4 h-4" /> Assign Property
            </button>
          </div>
          <p className="p-5 text-sm text-gray-400">No property assigned yet.</p>
        </div>
      )}

      {customer.customerApartments?.length > 0 && (
        <button className="btn-secondary w-full justify-center text-sm" onClick={() => setShowAssign(true)}>
          <Plus className="w-4 h-4" /> Assign Another Property
        </button>
      )}

      {/* ── Modals ── */}
      {showEdit && (
        <Modal title="Edit Customer Profile" onClose={() => setShowEdit(false)}>
          <EditProfileForm customer={customer} onSuccess={() => { setShowEdit(false); invalidate() }} />
        </Modal>
      )}

      {showAssign && (
        <Modal title="Assign Property" onClose={() => setShowAssign(false)}>
          <AssignApartmentForm customerId={id}
            onSuccess={() => { setShowAssign(false); invalidate() }} />
        </Modal>
      )}

      {processAssignmentId && (() => {
        const assignment = customer.customerApartments?.find(a => a.id === processAssignmentId)
        if (!assignment) return null
        return (
          <Modal title="Purchase Process & Next Steps"
            onClose={() => setProcessAssignmentId(null)} size="lg">
            <PurchaseProcessForm
              assignment={assignment}
              onSuccess={() => { setProcessAssignmentId(null); invalidate() }} />
          </Modal>
        )
      })()}

      {showDocument && (
        <Modal title="Upload Document" onClose={() => setShowDocument(null)}>
          <DocumentForm assignmentId={showDocument}
            onSuccess={() => { setShowDocument(null); invalidate() }} />
        </Modal>
      )}

      {showReset && (
        <Modal title="Reset Password" onClose={() => setShowReset(false)}>
          <ResetPasswordForm customerId={id} onSuccess={() => setShowReset(false)} />
        </Modal>
      )}
    </div>
  )
}

function ResetPasswordForm({ customerId, onSuccess }) {
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm()
  const mutation = useMutation({
    mutationFn: (data) => api.post(`/admin/customers/${customerId}/reset-password`, data),
    onSuccess,
  })
  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      {mutation.isError && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
          {mutation.error?.response?.data?.message || 'Error'}
        </div>
      )}
      {mutation.isSuccess && (
        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg">Password reset successfully.</div>
      )}
      <div>
        <label className="label">New Password *</label>
        <input className={`input ${errors.newPassword ? 'border-red-400' : ''}`}
          type="text"
          {...register('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
        {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  )
}
