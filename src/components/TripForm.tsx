import { useState } from 'react'
import type { PlanTripRequest } from '../api/client.ts'

export interface TripFormValues extends PlanTripRequest {}

interface TripFormProps {
  onSubmit: (values: TripFormValues) => void | Promise<void>
  loading?: boolean
}

export function TripForm({ onSubmit, loading }: TripFormProps) {
  const today = new Date().toISOString().slice(0, 10)

  const [values, setValues] = useState<TripFormValues>({
    from_city: 'Lahore',
    to_city: 'New York',
    departure_date: today,
    return_date: today,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof TripFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!values.from_city.trim()) next.from_city = 'From city is required.'
    if (!values.to_city.trim()) next.to_city = 'To city is required.'
    if (!values.departure_date) next.departure_date = 'Departure date is required.'
    if (!values.return_date) next.return_date = 'Return date is required.'
    if (values.departure_date && values.return_date && values.return_date < values.departure_date) {
      next.return_date = 'Return date must be after departure.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await onSubmit(values)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-6 sm:py-6"
    >
      <div className="mb-2 flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700">
            From city
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={values.from_city}
              onChange={handleChange('from_city')}
              placeholder="Lahore"
            />
          </label>
          {errors.from_city && <p className="mt-1 text-xs text-red-600">{errors.from_city}</p>}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700">
            To city
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={values.to_city}
              onChange={handleChange('to_city')}
              placeholder="New York"
            />
          </label>
          {errors.to_city && <p className="mt-1 text-xs text-red-600">{errors.to_city}</p>}
        </div>
      </div>

      <p className="mb-4 text-xs text-slate-500">
        This planner is designed for trips where you{' '}
        <span className="font-semibold">start in one country and visit cities in a different country</span>.
        For example, <span className="font-semibold">Lahore → New York</span> is valid, but same–country routes
        like <span className="font-semibold">Lahore → Karachi</span> are not currently supported.
      </p>

      <div className="mb-4 flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700">
            Departure date
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={values.departure_date}
              onChange={handleChange('departure_date')}
            />
          </label>
          {errors.departure_date && <p className="mt-1 text-xs text-red-600">{errors.departure_date}</p>}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700">
            Return date
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={values.return_date}
              onChange={handleChange('return_date')}
            />
          </label>
          {errors.return_date && <p className="mt-1 text-xs text-red-600">{errors.return_date}</p>}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-xs text-slate-500">This may take 3-5 minutes while the agents plan your trip.</p>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {loading ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Planning…
            </>
          ) : (
            'Plan my trip'
          )}
        </button>
      </div>
    </form>
  )
}

