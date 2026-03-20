import type { CityStay } from '../types/itinerary.ts'

interface Props {
  cityStays: CityStay[]
}

function formatDate(value?: string | null) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const CITY_COLORS = [
  'from-indigo-500 to-violet-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-sky-500 to-blue-500',
]

export function CityStays({ cityStays }: Props) {
  if (!cityStays.length) return null

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Cities & stays</p>
        <p className="text-sm font-semibold text-slate-900">{cityStays.length} {cityStays.length === 1 ? 'destination' : 'destinations'}</p>
      </div>

      {/* Timeline */}
      <div className="px-5 py-4">
        <div className="relative">
          {/* Vertical connector line */}
          {cityStays.length > 1 && (
            <div className="absolute left-[18px] top-6 bottom-6 w-px bg-slate-200" />
          )}

          <div className="space-y-4">
            {cityStays.map((stay, idx) => {
              const gradient = CITY_COLORS[idx % CITY_COLORS.length]
              return (
                <div key={`${stay.city}-${idx}`} className="flex gap-4">
                  {/* Circle indicator */}
                  <div className={`relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-xs font-bold text-white shadow-sm`}>
                    {idx + 1}
                  </div>

                  {/* Card */}
                  <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{stay.city}</h4>
                      {stay.nights != null && stay.nights > 0 && (
                        <span className="flex-shrink-0 rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {stay.nights}N
                        </span>
                      )}
                      {stay.nights === 0 && (
                        <span className="flex-shrink-0 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                          Return
                        </span>
                      )}
                    </div>

                    {stay.arrival_date && (
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(stay.arrival_date)}
                      </p>
                    )}

                    {stay.neighborhood_suggestion && (
                      <div className="mt-2 flex items-start gap-1.5">
                        <span className="mt-0.5 text-xs text-indigo-400">📍</span>
                        <p className="text-xs text-indigo-700 font-medium leading-snug">{stay.neighborhood_suggestion}</p>
                      </div>
                    )}

                    {stay.notes && (
                      <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{stay.notes}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
