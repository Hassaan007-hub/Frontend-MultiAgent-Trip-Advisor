import type { ItineraryResponse } from '../types/itinerary.ts'

interface Props {
  itinerary: ItineraryResponse
}

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function ItinerarySummary({ itinerary }: Props) {
  const { from_city, to_city, departure_date, return_date, summary, city_stays } = itinerary
  const uniqueCities = new Set(city_stays.map(c => c.city)).size || 1
  const tripNights = (() => {
    const start = new Date(departure_date)
    const end = new Date(return_date)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
      return city_stays.reduce((sum, s) => sum + (s.nights ?? 0), 0)
    return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000))
  })()

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Route banner */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 px-5 py-5 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-200">Your itinerary</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-bold leading-tight">{from_city}</p>
            <p className="text-[11px] text-indigo-200">Departure</p>
          </div>
          <div className="flex flex-1 items-center gap-1">
            <div className="h-px flex-1 bg-indigo-300/60" />
            <span className="text-xl">✈</span>
            <div className="h-px flex-1 bg-indigo-300/60" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">{to_city}</p>
            <p className="text-[11px] text-indigo-200">Destination</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-indigo-100">
          {formatDate(departure_date)} → {formatDate(return_date)}
        </p>
      </div>

      {/* Stats row */}
      <div className="flex divide-x divide-slate-100 border-b border-slate-100">
        <div className="flex flex-1 flex-col items-center py-3">
          <p className="text-lg font-bold text-slate-900">{tripNights}</p>
          <p className="text-[11px] text-slate-500">{tripNights === 1 ? 'Night' : 'Nights'}</p>
        </div>
        <div className="flex flex-1 flex-col items-center py-3">
          <p className="text-lg font-bold text-slate-900">{uniqueCities}</p>
          <p className="text-[11px] text-slate-500">{uniqueCities === 1 ? 'City' : 'Cities'}</p>
        </div>
        <div className="flex flex-1 flex-col items-center py-3">
          <p className="text-lg font-bold text-slate-900">{city_stays.length || '—'}</p>
          <p className="text-[11px] text-slate-500">Stays</p>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-slate-600">{summary}</p>
        </div>
      )}
    </section>
  )
}
