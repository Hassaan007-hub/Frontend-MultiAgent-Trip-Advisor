import type { TravelLeg } from '../types/itinerary.ts'

interface Props {
  legs: TravelLeg[]
}

function getModeIcon(leg: TravelLeg): string {
  const text = `${leg.mode ?? ''} ${leg.notes ?? ''}`.toLowerCase()
  if (text.includes('flight') || text.includes('fly') || text.includes('air')) return '✈'
  if (text.includes('train') || text.includes('rail') || text.includes('eurostar')) return '🚆'
  if (text.includes('bus') || text.includes('coach')) return '🚌'
  if (text.includes('ferry') || text.includes('boat') || text.includes('ship')) return '⛴'
  if (text.includes('drive') || text.includes('car') || text.includes('taxi') || text.includes('uber')) return '🚗'
  if (text.includes('walk')) return '🚶'
  return '🗺'
}

function getModeLabel(leg: TravelLeg): string {
  if (leg.mode) return leg.mode.charAt(0).toUpperCase() + leg.mode.slice(1)
  const text = `${leg.notes ?? ''}`.toLowerCase()
  if (text.includes('flight') || text.includes('fly')) return 'Flight'
  if (text.includes('train') || text.includes('rail')) return 'Train'
  if (text.includes('bus')) return 'Bus'
  if (text.includes('ferry') || text.includes('boat')) return 'Ferry'
  return 'Travel'
}

export function TravelLegs({ legs }: Props) {
  if (!legs.length) return null

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Travel legs</p>
        <p className="text-sm font-semibold text-slate-900">{legs.length} {legs.length === 1 ? 'journey' : 'journeys'}</p>
      </div>

      <div className="divide-y divide-slate-100">
        {legs.map((leg, idx) => {
          const icon = getModeIcon(leg)
          const modeLabel = getModeLabel(leg)
          const isFirstLeg = idx === 0

          return (
            <div key={`${leg.from_city}-${leg.to_city}-${idx}`} className="px-5 py-4">
              {/* Route row */}
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-base ${isFirstLeg ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                  {icon}
                </div>
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  <span className="truncate text-sm font-semibold text-slate-900">{leg.from_city}</span>
                  <span className="flex-shrink-0 text-slate-300">→</span>
                  <span className="truncate text-sm font-semibold text-slate-900">{leg.to_city}</span>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${isFirstLeg ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                  {modeLabel}
                  {leg.duration_hours != null && ` · ~${leg.duration_hours}h`}
                </span>
              </div>

              {/* Notes */}
              {leg.notes && (
                <p className="mt-2 ml-11 text-xs leading-relaxed text-slate-500">{leg.notes}</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
