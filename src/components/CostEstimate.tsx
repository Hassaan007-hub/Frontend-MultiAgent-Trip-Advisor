import { useEffect, useState } from 'react'
import type { CostEstimate } from '../types/itinerary.ts'
import { getCurrencyForCountry, convertAmountStatic, fetchLiveRates, formatAmount, CURRENCY_INFO } from '../utils/currency.ts'

interface Props {
  cost?: CostEstimate | null
  fromCountry?: string | null
  toCountry?: string | null
}

const BREAKDOWN_LABELS: Record<string, string> = {
  lodging: 'Lodging', accommodation: 'Lodging',
  food: 'Food & Dining', meals: 'Food & Dining',
  local_transport: 'Local Transport', transport: 'Local Transport',
  attractions: 'Attractions', activities: 'Attractions',
  miscellaneous: 'Miscellaneous', other: 'Other',
}

function labelFor(key: string) {
  const k = key.toLowerCase().replace(/\s+/g, '_')
  return BREAKDOWN_LABELS[k] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const FLIGHT_KEYS = new Set(['international_flights', 'flights', 'flight', 'intl_flights'])
function isFlightKey(k: string) { return FLIGHT_KEYS.has(k.toLowerCase()) || k.toLowerCase().includes('flight') }

/** Strip structured metadata tokens already shown in the card UI. */
function stripMetadata(raw: string): string {
  let s = raw
  s = s.replace(/[-•*]?\s*\*{0,2}Currency\*{0,2}:?\*{0,2}\s*[A-Z]{3}\b/gi, '')
  s = s.replace(/[-•*]?\s*\*{0,2}Total[\s_]Min\*{0,2}:?\*{0,2}\s*[\d,]+/gi, '')
  s = s.replace(/[-•*]?\s*\*{0,2}Total[\s_]Max\*{0,2}:?\*{0,2}\s*[\d,]+/gi, '')
  s = s.replace(/[-•*]?\s*\*{0,2}Per[\s_]Day[\s_]Min\*{0,2}:?\*{0,2}\s*[\d,]+/gi, '')
  s = s.replace(/[-•*]?\s*\*{0,2}Per[\s_]Day[\s_]Max\*{0,2}:?\*{0,2}\s*[\d,]+/gi, '')
  s = s.replace(/\*\*Total \(excl[^)]*\):\*\*[^\n]*/gi, '')
  s = s.replace(/\*\*Per person[^*]*:\*\*[^\n]*/gi, '')
  return s.replace(/\s{2,}/g, ' ').trim()
}

/**
 * Parse a notes string into individual bullet items.
 * Handles both newline-separated and " - " inline-separated formats.
 */
function parseNoteItems(raw: string): string[] {
  const cleaned = stripMetadata(raw)
  if (!cleaned) return []
  // Split on newline bullets OR inline " - " separators
  const items = cleaned
    .split(/\n+|(?<=\w[\.\),])\s+-\s+/)
    .map(s => s.replace(/^[-•*]\s*/, '').replace(/\*\*([^*]+)\*\*/g, '$1').trim())
    .filter(s => s.length > 2)
  return items
}

export function CostEstimateCard({ cost, fromCountry, toCountry }: Props) {
  const [liveRates, setLiveRates] = useState<Record<string, number> | null>(null)
  const [ratesLive, setRatesLive] = useState(false)

  const primaryCurrency = cost?.currency || (toCountry ? getCurrencyForCountry(toCountry) : null) || 'USD'
  const secondaryCurrency = fromCountry ? getCurrencyForCountry(fromCountry) : null
  const showSecondary = !!secondaryCurrency && secondaryCurrency !== primaryCurrency

  useEffect(() => {
    if (!primaryCurrency || !showSecondary) return
    fetchLiveRates(primaryCurrency).then(rates => { if (rates) { setLiveRates(rates); setRatesLive(true) } })
  }, [primaryCurrency, showSecondary])

  const conv = (n: number) => {
    if (!showSecondary || !secondaryCurrency) return null
    return liveRates?.[secondaryCurrency] != null
      ? Math.round(n * liveRates[secondaryCurrency])
      : convertAmountStatic(n, primaryCurrency, secondaryCurrency)
  }

  const f = (n: number) => formatAmount(n, primaryCurrency)
  const fs = (n: number) => { const c = conv(n); return c != null ? formatAmount(c, secondaryCurrency!) : null }

  if (!cost) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cost estimate</p>
        <p className="mt-2 text-sm text-slate-500">Not available for this itinerary.</p>
      </section>
    )
  }

  const totalMin = cost.total_min ?? cost.total_estimated
  const totalMax = cost.total_max ?? cost.total_estimated
  const dayMin = cost.per_day_min ?? cost.per_person_per_day
  const dayMax = cost.per_day_max ?? cost.per_person_per_day

  const breakdownAll = Object.entries(cost.breakdown ?? {}).filter(([, v]) => v?.trim())
  const regularItems = breakdownAll.filter(([k]) => !isFlightKey(k))
  const flightItem = breakdownAll.find(([k]) => isFlightKey(k))

  const primaryInfo = CURRENCY_INFO[primaryCurrency]
  const secondaryInfo = showSecondary ? CURRENCY_INFO[secondaryCurrency!] : null

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white px-5 py-3 border-b border-slate-100">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400">Cost estimate</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
              {primaryCurrency}{primaryInfo ? ` · ${primaryInfo.name}` : ''}
            </span>
            {showSecondary && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                {secondaryCurrency}{secondaryInfo ? ` · ${secondaryInfo.name}` : ''}
              </span>
            )}
          </div>
        </div>
        {showSecondary && (
          <span className={`flex items-center gap-1 text-[10px] font-medium ${ratesLive ? 'text-emerald-600' : 'text-slate-400'}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {ratesLive ? 'Live rates' : 'Approx.'}
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Total + Per Day */}
        {(totalMin != null || dayMin != null) && (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
            {totalMin != null && (
              <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                <span className="text-xs font-medium text-slate-500">Total <span className="text-slate-400">(excl. int'l flights)</span></span>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {totalMax != null && totalMax !== totalMin ? `${f(totalMin)} – ${f(totalMax)}` : f(totalMin)}
                  </p>
                  {(() => {
                    const lo = fs(totalMin)
                    const hi = totalMax != null && totalMax !== totalMin ? fs(totalMax) : null
                    if (!lo) return null
                    return <p className="text-[11px] font-medium text-amber-600">{hi ? `${lo} – ${hi}` : lo}</p>
                  })()}
                </div>
              </div>
            )}
            {dayMin != null && (
              <div className="flex items-center justify-between bg-white px-4 py-3">
                <span className="text-xs font-medium text-slate-500">Per person / day</span>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {dayMax != null && dayMax !== dayMin ? `${f(dayMin)} – ${f(dayMax)}` : f(dayMin)}
                  </p>
                  {(() => {
                    const lo = fs(dayMin)
                    const hi = dayMax != null && dayMax !== dayMin ? fs(dayMax) : null
                    if (!lo) return null
                    return <p className="text-[11px] font-medium text-amber-600">{hi ? `${lo} – ${hi}` : lo}</p>
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Breakdown */}
        {regularItems.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Breakdown</p>
            <div className="space-y-1.5">
              {regularItems.map(([key, val]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-300 flex-shrink-0" />
                    {labelFor(key)}
                  </span>
                  <span className="font-semibold text-slate-700">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* International flights */}
        {flightItem && (
          <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
            <span className="flex items-center gap-2 text-slate-500">
              <span className="text-base">✈</span>
              <span>International flights <span className="text-slate-400">(not included in total)</span></span>
            </span>
            <span className="font-semibold text-slate-600">{flightItem[1]}</span>
          </div>
        )}

        {/* Notes */}
        {(() => {
          const items = cost.notes ? parseNoteItems(cost.notes) : []
          if (!items.length) return null
          return (
            <div className="border-t border-slate-100 pt-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Assumptions</p>
              <ul className="space-y-1">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
                    <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-slate-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )
        })()}
      </div>
    </section>
  )
}
