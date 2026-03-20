import type { ItineraryResponse } from '../types/itinerary.ts'

export interface PlanTripRequest {
  from_city: string
  to_city: string
  departure_date: string
  return_date: string
  interests: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const API_KEY = import.meta.env.VITE_BACKEND_API_KEY ?? ''

export async function planTrip(payload: PlanTripRequest): Promise<ItineraryResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (API_KEY.trim()) {
    headers['X-API-Key'] = API_KEY.trim()
  }
  const res = await fetch(`${API_BASE_URL}/plan-trip`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let detail = ''
    try {
      const data = (await res.json()) as { detail?: unknown }
      if (data && typeof data.detail === 'string') {
        detail = data.detail
      } else if (Array.isArray(data.detail)) {
        detail = data.detail.map((d) => (typeof d === 'string' ? d : JSON.stringify(d))).join(', ')
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(detail || `Backend error (${res.status})`)
  }

  return (await res.json()) as ItineraryResponse
}

export async function deletePlans(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/plans`, { method: 'DELETE' })
  } catch {
    // best-effort cleanup — ignore errors
  }
}

