import React, { useState, useEffect } from 'react'
import type { ItineraryResponse } from './types/itinerary.ts'
import { planTrip, deletePlans } from './api/client.ts'
import { TripForm } from './components/TripForm.tsx'
import type { TripFormValues } from './components/TripForm.tsx'
import { ItinerarySummary } from './components/ItinerarySummary.tsx'
import { CityStays } from './components/CityStays.tsx'
import { TravelLegs } from './components/TravelLegs.tsx'
import { DayPlans } from './components/DayPlans.tsx'
import { CostEstimateCard } from './components/CostEstimate.tsx'
import { downloadDocx, downloadPdf } from './utils/downloadPlan.ts'

function App() {
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: TripFormValues) => {
    setLoading(true)
    setError(null)
    try {
      const res = await planTrip(values)
      setItinerary(res)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      setItinerary(null)
    } finally {
      setLoading(false)
    }
  }

  const handleNewTrip = () => {
    deletePlans()
    setItinerary(null)
    setError(null)
  }

  useEffect(() => {
    const cleanup = () => deletePlans()
    window.addEventListener('beforeunload', cleanup)
    return () => window.removeEventListener('beforeunload', cleanup)
  }, [])

  const showForm = !itinerary

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Multi-Agent Foreign Trip Planner
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Plan rich itineraries powered by your backend crew.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {showForm && (
          <section>
            <TripForm onSubmit={handleSubmit} loading={loading} />
            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <p className="font-medium">Unable to plan trip</p>
                <p className="mt-1">{error}</p>
              </div>
            )}
          </section>
        )}

        {showForm && !loading && !error && (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-600">
            Fill in the form above and hit{' '}
            <span className="font-semibold text-indigo-600">Plan my trip</span> to see your itinerary.
          </section>
        )}

        {itinerary && (
          <div className="flex justify-start">
            <button
              onClick={handleNewTrip}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
            >
              <span>＋</span> Create new trip plan
            </button>
          </div>
        )}

        {itinerary && (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
            <div className="space-y-6">
              <ItinerarySummary itinerary={itinerary} />
              <CityStays cityStays={itinerary.city_stays} />
              <DayPlans days={itinerary.days} />
            </div>
            <div className="space-y-6">
              <TravelLegs legs={itinerary.travel_legs} />
              <CostEstimateCard cost={itinerary.cost_estimate} fromCountry={itinerary.from_country} toCountry={itinerary.to_country} />
            </div>
          </section>
        )}

        {itinerary && (
          <section className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm sm:flex-row sm:justify-center">
            <p className="text-sm font-medium text-slate-600">Save your itinerary:</p>
            <button
              onClick={() => downloadDocx(itinerary)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 active:bg-indigo-900"
            >
              <span>📄</span> Download Plan DOCX
            </button>
            <button
              onClick={() => downloadPdf(itinerary)}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 active:bg-violet-900"
            >
              <span>📑</span> Download Plan PDF
            </button>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white/70 py-4 text-center text-sm text-slate-500">
        Built by{' '}
        <span className="font-medium text-slate-700">{import.meta.env.VITE_Developer_Name}</span>
        {' · '}
        <a href={`mailto:${import.meta.env.VITE_Developer_Email}`} className="text-indigo-600 hover:underline">
          {import.meta.env.VITE_Developer_Email}
        </a>
        {' · '}
        <a href={import.meta.env.VITE_Developer_LinkedIn} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
          LinkedIn
        </a>
      </footer>
    </div>
  )
}

export default App

