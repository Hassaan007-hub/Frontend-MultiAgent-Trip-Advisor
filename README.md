# ✈️ Multi-Agent Foreign Trip Planner — Frontend

React + TypeScript frontend for the Multi-Agent Trip Advisor. Communicates with the FastAPI backend to display AI-generated international travel itineraries.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite 7 | Build tool & dev server |
| Tailwind CSS 4 | Styling |
| docx | Download itinerary as Word document |
| jsPDF | Download itinerary as PDF |

---

## Project Structure

```
src/
├── api/
│   └── client.ts          # Backend API calls (planTrip, deletePlans)
├── components/
│   ├── TripForm.tsx        # Trip input form
│   ├── ItinerarySummary.tsx# Header card (route, nights, cities)
│   ├── CityStays.tsx       # Cities & stays timeline
│   ├── TravelLegs.tsx      # Flight/travel legs card
│   ├── DayPlans.tsx        # Day-by-day accordion plan
│   └── CostEstimate.tsx    # Cost estimate with live currency conversion
├── types/
│   └── itinerary.ts        # TypeScript types for API response
├── utils/
│   ├── currency.ts         # Live exchange rates + static fallback
│   └── downloadPlan.ts     # DOCX and PDF export logic
├── App.tsx                 # Root component
└── main.tsx                # Entry point
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Backend running at `http://localhost:8000`

### Setup

```bash
# Install dependencies
npm install

# Copy env template and fill in values
cp .env.example .env
```

### Environment Variables

Create a `.env` file in this directory:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000

# Must match BACKEND_API_KEY in the backend .env
VITE_BACKEND_API_KEY=your_secret_key

# Portfolio footer
VITE_Developer_Name=Your Name
VITE_Developer_Email=you@email.com
VITE_Developer_LinkedIn=https://linkedin.com/in/yourprofile
```

> **Note:** All `VITE_*` variables are bundled into the JavaScript at build time and are visible in the browser. Never put secrets like your Groq API key here.

### Run

```bash
# Development server (http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Features

- **Trip planning form** — enter departure city, destination, dates and interests
- **Itinerary summary** — route header with nights, cities and stays count
- **Cities & stays** — timeline of destination cities with neighborhood suggestions
- **Travel legs** — all flight/transport legs including the international arrival
- **Day-by-day plan** — accordion with timed activities for every day
- **Cost estimate** — trip cost in destination currency with live PKR/local conversion
- **Export** — download full itinerary as DOCX or PDF
- **API key guard** — sends `X-API-Key` header when `VITE_BACKEND_API_KEY` is set

---

## Backend

This frontend requires the FastAPI backend to be running. See the backend README in `../Backend_Trip_Advisor_Agent/`.
