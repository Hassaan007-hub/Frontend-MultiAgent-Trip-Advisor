import { useState } from 'react'
import type { DayPlan } from '../types/itinerary.ts'

interface Props {
  days: DayPlan[]
}

function formatDate(value?: string | null) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function getTimeIcon(timeOfDay?: string | null): string {
  if (!timeOfDay) return '📌'
  const t = timeOfDay.toLowerCase()
  if (t.includes('morning') || t.match(/^[5-9]:|^1[0-1]:/)) return '🌅'
  if (t.includes('afternoon') || t.match(/^1[2-6]:/)) return '☀'
  if (t.includes('evening') || t.includes('dinner') || t.match(/^1[7-9]:|^2[0-1]:/)) return '🌆'
  if (t.includes('night') || t.match(/^2[2-9]:|^[0-4]:/)) return '🌙'
  return '🕐'
}

const DAY_COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-violet-500']

export function DayPlans({ days }: Props) {
  const [openIdx, setOpenIdx] = useState<number>(0)
  if (!days.length) return null

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Day-by-day plan</p>
        <p className="text-sm font-semibold text-slate-900">{days.length} {days.length === 1 ? 'day' : 'days'} planned</p>
      </div>

      <div className="divide-y divide-slate-100">
        {days.map((day, idx) => {
          const isOpen = openIdx === idx
          const dateLabel = formatDate(day.date) ?? `Day ${idx + 1}`
          const dotColor = DAY_COLORS[idx % DAY_COLORS.length]

          return (
            <div key={`${day.date ?? idx}-${idx}`}>
              {/* Accordion header */}
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
              >
                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${dotColor} text-[11px] font-bold text-white`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{dateLabel}</p>
                  <p className="text-xs text-slate-500 truncate">{day.city}{day.activities.length > 0 ? ` · ${day.activities.length} activities` : ''}</p>
                </div>
                <span className={`text-slate-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* Activities */}
              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-5 pb-4 pt-3">
                  {day.summary && (
                    <p className="mb-3 text-xs text-slate-500 italic">{day.summary}</p>
                  )}
                  <div className="relative space-y-0">
                    {/* Vertical timeline line */}
                    {day.activities.length > 1 && (
                      <div className="absolute left-3 top-4 bottom-4 w-px bg-slate-200" />
                    )}

                    {day.activities.map((activity, i) => {
                      const icon = getTimeIcon(activity.time_of_day)
                      // Don't repeat description if it duplicates the title
                      const showDesc = activity.description &&
                        activity.description.trim() !== activity.title.trim() &&
                        !activity.description.includes(activity.title)

                      return (
                        <div key={`${activity.title}-${i}`} className="relative flex gap-3 pb-3 last:pb-0">
                          {/* Timeline dot */}
                          <div className="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-sm shadow-xs">
                            {icon}
                          </div>

                          <div className="flex-1 rounded-lg bg-white border border-slate-100 px-3 py-2 shadow-xs">
                            {activity.time_of_day && (
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500 mb-0.5">
                                {activity.time_of_day}
                              </p>
                            )}
                            <p className="text-xs font-semibold text-slate-800 leading-snug">{activity.title}</p>
                            {showDesc && (
                              <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{activity.description}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
