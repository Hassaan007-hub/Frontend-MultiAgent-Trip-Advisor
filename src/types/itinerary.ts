export interface Activity {
  title: string
  time_of_day?: string | null
  location?: string | null
  description?: string | null
  estimated_cost?: number | null
}

export interface DayPlan {
  date?: string | null
  city: string
  summary?: string | null
  activities: Activity[]
}

export interface CityStay {
  city: string
  arrival_date?: string | null
  departure_date?: string | null
  nights?: number | null
  neighborhood_suggestion?: string | null
  notes?: string | null
}

export interface TravelLeg {
  from_city: string
  to_city: string
  mode?: string | null
  duration_hours?: number | null
  notes?: string | null
}

export interface CostEstimate {
  currency?: string | null
  total_min?: number | null
  total_max?: number | null
  total_estimated?: number | null
  per_day_min?: number | null
  per_day_max?: number | null
  per_person_per_day?: number | null
  breakdown?: Record<string, string> | null
  notes?: string | null
}

export interface ItineraryResponse {
  from_city: string
  to_city: string
  from_country?: string | null
  to_country?: string | null
  departure_date: string
  return_date: string
  summary?: string | null
  city_stays: CityStay[]
  travel_legs: TravelLeg[]
  days: DayPlan[]
  cost_estimate?: CostEstimate | null
  assumptions?: string | null
}

