import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from 'docx'
import { jsPDF } from 'jspdf'
import type { ItineraryResponse } from '../types/itinerary.ts'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d?: string | null): string {
  if (!d) return ''
  const dt = new Date(d + 'T00:00:00')
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function safeFilename(itin: ItineraryResponse): string {
  return `trip_${itin.from_city}_${itin.to_city}`.replace(/\s+/g, '_').replace(/[^\w_-]/g, '')
}

// Currency symbol lookup — used by both DOCX and PDF cost sections
const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£',  USD: '$',   EUR: '€',   JPY: '¥',   INR: '₹',
  PKR: 'Rs ', AUD: 'A$',  CAD: 'C$',  CHF: 'Fr ', SGD: 'S$',
  HKD: 'HK$', CNY: '¥',  KRW: '₩',  THB: '฿',   MYR: 'RM ',
  IDR: 'Rp ', PHP: '₱',  VND: '₫',  BRL: 'R$',  MXN: 'MX$',
  ZAR: 'R ',  NGN: '₦',  EGP: 'E£',  TRY: '₺',  SAR: 'SR ',
  AED: 'AED ', DKK: 'kr ', NOK: 'kr ', SEK: 'kr ', NZD: 'NZ$',
  QAR: 'QR ', KWD: 'KD ', BHD: 'BD ', OMR: 'OMR ', JOD: 'JD ',
}

function fmtCost(amount: number, currency?: string | null): string {
  const code = (currency ?? '').toUpperCase()
  const sym  = CURRENCY_SYMBOLS[code] ?? (code ? `${code} ` : '')
  return `${sym}${amount.toLocaleString()}`
}

function fmtCostRange(min: number, max: number | null | undefined, currency?: string | null): string {
  if (max != null && max !== min) return `${fmtCost(min, currency)} - ${fmtCost(max, currency)}`
  return fmtCost(min, currency)
}

// Strip markdown metadata tokens (Currency/Total Min/Max/Per Day) already
// shown in the structured cost rows, then clean ** bold markers so the
// assumptions list renders as plain readable text in both DOCX and PDF.
function parseNoteItems(raw: string): string[] {
  let s = raw
  s = s.replace(/[-•*]?\s*\*{0,2}Currency\*{0,2}:?\*{0,2}\s*[A-Z]{3}\b/gi, '')
  s = s.replace(/[-•*]?\s*\*{0,2}Total[\s_]Min\*{0,2}:?\*{0,2}\s*[\d,]+/gi, '')
  s = s.replace(/[-•*]?\s*\*{0,2}Total[\s_]Max\*{0,2}:?\*{0,2}\s*[\d,]+/gi, '')
  s = s.replace(/[-•*]?\s*\*{0,2}Per[\s_]Day[\s_]Min\*{0,2}:?\*{0,2}\s*[\d,]+/gi, '')
  s = s.replace(/[-•*]?\s*\*{0,2}Per[\s_]Day[\s_]Max\*{0,2}:?\*{0,2}\s*[\d,]+/gi, '')
  s = s.replace(/\*\*/g, '')   // strip remaining bold markers
  return s
    .split(/\n+/)
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(line => line.length > 2)
}

// ─── DOCX ─────────────────────────────────────────────────────────────────────

export async function downloadDocx(itin: ItineraryResponse): Promise<void> {
  const INDIGO = '3730a3'
  const SLATE  = '334155'
  const MUTED  = '64748b'
  const WHITE  = 'FFFFFF'

  const children: (Paragraph | Table)[] = []

  // Helpers
  const gap = (space = 80) =>
    new Paragraph({ text: '', spacing: { after: space } })

  const heading = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
    new Paragraph({
      children: [new TextRun({ text, bold: true, color: level === HeadingLevel.HEADING_1 ? WHITE : INDIGO, size: level === HeadingLevel.HEADING_1 ? 26 : 22 })],
      heading: level,
      spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 200, after: 120 },
      ...(level === HeadingLevel.HEADING_1 && {
        shading: { type: ShadingType.SOLID, color: INDIGO },
        indent: { left: 160 },
      }),
    })

  const para = (text: string, opts?: { bold?: boolean; italic?: boolean; size?: number; color?: string; indent?: number }) =>
    new Paragraph({
      children: [new TextRun({
        text,
        bold: opts?.bold,
        italics: opts?.italic,
        size: opts?.size ?? 21,
        color: opts?.color ?? SLATE,
      })],
      spacing: { after: 80 },
      ...(opts?.indent ? { indent: { left: opts.indent } } : {}),
    })

  const bullet = (text: string, indent = 360) =>
    new Paragraph({
      children: [new TextRun({ text, size: 20, color: SLATE })],
      bullet: { level: 0 },
      indent: { left: indent },
      spacing: { after: 60 },
    })

  const divider = () =>
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'e2e8f0', space: 1 } },
      text: '',
      spacing: { after: 120 },
    })

  // ── Cover / Title ──────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${itin.from_city}  →  ${itin.to_city}`, bold: true, size: 56, color: INDIGO }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 160 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'TRIP ITINERARY', size: 28, color: MUTED, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
  )

  if (itin.departure_date && itin.return_date) {
    children.push(
      new Paragraph({
        children: [new TextRun({
          text: `${fmtDate(itin.departure_date)}  –  ${fmtDate(itin.return_date)}`,
          size: 22, color: MUTED,
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    )
  }

  if (itin.summary) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: itin.summary, italics: true, size: 21, color: MUTED })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
      }),
    )
  }

  // ── Cities & Stays ─────────────────────────────────────────────────────────
  if (itin.city_stays?.length) {
    children.push(heading('  CITIES & STAYS', HeadingLevel.HEADING_1))
    itin.city_stays.forEach((stay, i) => {
      const isReturn = stay.nights === 0
      children.push(
        para(`${i + 1}.  ${stay.city}${isReturn ? '  (Return)' : ''}`, { bold: true, size: 23, color: INDIGO }),
      )
      if (stay.arrival_date) children.push(para(`Date: ${fmtDate(stay.arrival_date)}`, { indent: 280 }))
      if (!isReturn && stay.nights != null) children.push(para(`Stay: ${stay.nights} night${stay.nights !== 1 ? 's' : ''}`, { indent: 280 }))
      if (stay.neighborhood_suggestion) children.push(para(`📍 ${stay.neighborhood_suggestion}`, { indent: 280, color: '6366f1' }))
      if (stay.notes) children.push(para(stay.notes, { italic: true, indent: 280, color: MUTED, size: 19 }))
      children.push(gap(80))
    })
    children.push(divider())
  }

  // ── Travel Legs ─────────────────────────────────────────────────────────────
  if (itin.travel_legs?.length) {
    children.push(heading('  TRAVEL LEGS', HeadingLevel.HEADING_1))
    itin.travel_legs.forEach(leg => {
      const mode = leg.mode ? `  (${leg.mode.charAt(0).toUpperCase() + leg.mode.slice(1)})` : ''
      const dur  = leg.duration_hours ? `  ·  ~${leg.duration_hours}h` : ''
      children.push(para(`✈  ${leg.from_city}  →  ${leg.to_city}${mode}${dur}`, { bold: true, size: 22, color: INDIGO }))
      if (leg.notes) children.push(para(leg.notes, { indent: 360, color: MUTED, size: 19 }))
      children.push(gap(80))
    })
    children.push(divider())
  }

  // ── Day-by-Day Plan ─────────────────────────────────────────────────────────
  if (itin.days?.length) {
    children.push(heading('  DAY-BY-DAY PLAN', HeadingLevel.HEADING_1))
    itin.days.forEach((day, i) => {
      const label = day.date ? fmtDate(day.date) : `Day ${i + 1}`
      children.push(
        heading(`Day ${i + 1}  —  ${label}  |  ${day.city}`, HeadingLevel.HEADING_2),
      )
      if (day.summary) children.push(para(day.summary, { italic: true, color: MUTED, size: 19 }))

      day.activities?.forEach(act => {
        const time = act.time_of_day ? `[${act.time_of_day}]  ` : ''
        children.push(bullet(`${time}${act.title}`))
        const showDesc = act.description
          && act.description.trim() !== act.title.trim()
          && !act.description.includes(act.title)
        if (showDesc) {
          children.push(para(act.description!, { italic: true, indent: 720, color: MUTED, size: 18 }))
        }
      })
      children.push(gap(120))
    })
    children.push(divider())
  }

  // ── Cost Estimate ───────────────────────────────────────────────────────────
  const cost = itin.cost_estimate
  if (cost) {
    children.push(heading('  COST ESTIMATE', HeadingLevel.HEADING_1))

    const cur      = cost.currency || null
    const totalMin = cost.total_min ?? cost.total_estimated
    const totalMax = cost.total_max ?? cost.total_estimated
    const dayMin   = cost.per_day_min ?? cost.per_person_per_day
    const dayMax   = cost.per_day_max ?? cost.per_person_per_day

    if (cur) children.push(para(`Currency: ${cur}`, { bold: true }))

    if (totalMin != null) {
      children.push(para(
        `Total (excl. int'l flights): ${fmtCostRange(totalMin, totalMax, cur)}`,
        { bold: true, color: INDIGO },
      ))
    }
    if (dayMin != null) {
      children.push(para(`Per person / day: ${fmtCostRange(dayMin, dayMax, cur)}`))
    }

    if (cost.breakdown && Object.keys(cost.breakdown).length) {
      children.push(gap(), para('Breakdown:', { bold: true }))
      Object.entries(cost.breakdown).forEach(([k, v]) => {
        if (v?.trim()) {
          const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          children.push(bullet(`${label}: ${v}`))
        }
      })
    }

    if (cost.notes) {
      const items = parseNoteItems(cost.notes)
      if (items.length) {
        children.push(gap(), para('Assumptions:', { bold: true }))
        items.forEach(item => children.push(bullet(item)))
      }
    }
  }

  // ── Build & save ────────────────────────────────────────────────────────────
  const doc = new Document({
    creator: 'Multi-Agent Trip Planner',
    title: `Trip Itinerary: ${itin.from_city} to ${itin.to_city}`,
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 21, color: SLATE } },
      },
    },
    sections: [{ children }],
  })

  const blob = await Packer.toBlob(doc)
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${safeFilename(itin)}.docx`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

export function downloadPdf(itin: ItineraryResponse): void {
  const pdf     = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW   = pdf.internal.pageSize.width
  const pageH   = pdf.internal.pageSize.height
  const margin  = 14
  const cw      = pageW - margin * 2   // content width
  let y         = margin

  // Color palette
  const C = {
    primary  : [55,  48,  163] as [number, number, number],   // indigo-800
    accent   : [99,  102, 241] as [number, number, number],   // indigo-500
    heading  : [30,  27,  75]  as [number, number, number],   // indigo-950
    body     : [30,  41,  59]  as [number, number, number],   // slate-800
    muted    : [100, 116, 139] as [number, number, number],   // slate-500
    light    : [241, 245, 249] as [number, number, number],   // slate-100
    white    : [255, 255, 255] as [number, number, number],
  }

  // ── Utilities ────────────────────────────────────────────────────────────────
  const needsPage = (h: number) => {
    if (y + h > pageH - margin) { pdf.addPage(); y = margin + 4 }
  }

  const write = (
    text: string,
    x: number,
    opts?: {
      size?: number
      style?: 'normal' | 'bold' | 'italic' | 'bolditalic'
      color?: [number, number, number]
      lineH?: number
      maxW?: number
    },
  ) => {
    const size  = opts?.size  ?? 10
    const lh    = opts?.lineH ?? (size * 0.48)
    pdf.setFontSize(size)
    pdf.setFont('helvetica', opts?.style ?? 'normal')
    pdf.setTextColor(...(opts?.color ?? C.body))
    const lines = pdf.splitTextToSize(text, opts?.maxW ?? (cw - (x - margin)))
    const needed = lines.length * lh + 1
    needsPage(needed)
    pdf.text(lines, x, y)
    y += needed
  }

  const sectionBanner = (title: string) => {
    y += 5
    needsPage(12)
    pdf.setFillColor(...C.primary)
    pdf.roundedRect(margin, y - 6, cw, 10, 2, 2, 'F')
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...C.white)
    pdf.text(title, margin + 4, y)
    y += 7
  }

  const hrule = () => {
    y += 2
    pdf.setDrawColor(226, 232, 240)
    pdf.line(margin, y, margin + cw, y)
    y += 3
  }

  // ── Cover banner ─────────────────────────────────────────────────────────────
  pdf.setFillColor(...C.primary)
  pdf.rect(0, 0, pageW, 42, 'F')

  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...C.white)
  pdf.text(`${itin.from_city}  ->  ${itin.to_city}`, margin, 16)

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(199, 210, 254)   // indigo-200
  pdf.text('TRIP ITINERARY', margin, 24)

  if (itin.departure_date && itin.return_date) {
    pdf.text(`${fmtDate(itin.departure_date)}  –  ${fmtDate(itin.return_date)}`, margin, 32)
  }

  y = 50
  if (itin.summary) {
    write(itin.summary, margin, { size: 9.5, style: 'italic', color: C.muted, lineH: 4.5 })
    y += 3
  }

  // ── Cities & Stays ────────────────────────────────────────────────────────────
  if (itin.city_stays?.length) {
    sectionBanner('CITIES & STAYS')
    itin.city_stays.forEach((stay, i) => {
      const isReturn = stay.nights === 0
      y += 3
      needsPage(22)
      write(
        `${i + 1}.  ${stay.city}${isReturn ? '  (Return)' : ''}`,
        margin + 2,
        { size: 11, style: 'bold', color: C.heading },
      )
      if (stay.arrival_date)
        write(`Date: ${fmtDate(stay.arrival_date)}`, margin + 7, { size: 9.5, color: C.muted })
      if (!isReturn && stay.nights != null)
        write(`Stay: ${stay.nights} night${stay.nights !== 1 ? 's' : ''}`, margin + 7, { size: 9.5, color: C.muted })
      if (stay.neighborhood_suggestion)
        write(`Area: ${stay.neighborhood_suggestion}`, margin + 7, { size: 9.5, color: C.accent })
      if (stay.notes)
        write(stay.notes, margin + 7, { size: 9, style: 'italic', color: C.muted, lineH: 4.2 })
    })
    hrule()
  }

  // ── Travel Legs ───────────────────────────────────────────────────────────────
  if (itin.travel_legs?.length) {
    sectionBanner('TRAVEL LEGS')
    itin.travel_legs.forEach(leg => {
      y += 3
      needsPage(16)
      const mode = leg.mode ? `  (${leg.mode.charAt(0).toUpperCase() + leg.mode.slice(1)})` : ''
      const dur  = leg.duration_hours ? `  ·  ~${leg.duration_hours}h` : ''
      write(`${leg.from_city}  ->  ${leg.to_city}${mode}${dur}`, margin + 2, { size: 11, style: 'bold', color: C.heading })
      if (leg.notes)
        write(leg.notes, margin + 7, { size: 9.5, color: C.muted, lineH: 4.5 })
    })
    hrule()
  }

  // ── Day-by-Day Plan ───────────────────────────────────────────────────────────
  if (itin.days?.length) {
    sectionBanner('DAY-BY-DAY PLAN')
    itin.days.forEach((day, i) => {
      const label = day.date ? fmtDate(day.date) : `Day ${i + 1}`
      y += 4
      needsPage(18)

      // Day header strip
      pdf.setFillColor(...C.light)
      pdf.roundedRect(margin, y - 5, cw, 9, 1.5, 1.5, 'F')
      pdf.setFontSize(10.5)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...C.heading)
      pdf.text(`Day ${i + 1}  —  ${label}  |  ${day.city}`, margin + 3, y)
      y += 6

      if (day.summary)
        write(day.summary, margin + 4, { size: 9, style: 'italic', color: C.muted })

      day.activities?.forEach(act => {
        needsPage(10)
        const time = act.time_of_day ? `[${act.time_of_day}]  ` : ''
        write(`•  ${time}${act.title}`, margin + 5, { size: 9.5, color: C.body, lineH: 4.8 })
        const showDesc = act.description
          && act.description.trim() !== act.title.trim()
          && !act.description.includes(act.title)
        if (showDesc) {
          write(act.description!, margin + 10, { size: 8.5, style: 'italic', color: C.muted, lineH: 4.2 })
        }
      })
    })
    hrule()
  }

  // ── Cost Estimate ─────────────────────────────────────────────────────────────
  const cost = itin.cost_estimate
  if (cost) {
    sectionBanner('COST ESTIMATE')
    y += 2

    const cur      = cost.currency || null
    const totalMin = cost.total_min ?? cost.total_estimated
    const totalMax = cost.total_max ?? cost.total_estimated
    const dayMin   = cost.per_day_min ?? cost.per_person_per_day
    const dayMax   = cost.per_day_max ?? cost.per_person_per_day

    if (cur) write(`Currency: ${cur}`, margin + 2, { size: 10, style: 'bold', color: C.heading })

    if (totalMin != null) {
      write(
        `Total (excl. int'l flights):  ${fmtCostRange(totalMin, totalMax, cur)}`,
        margin + 2, { size: 10, style: 'bold', color: C.primary },
      )
    }
    if (dayMin != null) {
      write(
        `Per person / day:  ${fmtCostRange(dayMin, dayMax, cur)}`,
        margin + 2, { size: 10, color: C.body },
      )
    }

    if (cost.breakdown && Object.keys(cost.breakdown).length) {
      y += 2
      write('Breakdown:', margin + 2, { size: 10, style: 'bold', color: C.body })
      Object.entries(cost.breakdown).forEach(([k, v]) => {
        if (v?.trim()) {
          const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          write(`  •  ${label}: ${v}`, margin + 5, { size: 9.5, color: C.muted })
        }
      })
    }

    if (cost.notes) {
      const noteItems = parseNoteItems(cost.notes)
      if (noteItems.length) {
        y += 2
        write('Assumptions:', margin + 2, { size: 10, style: 'bold', color: C.body })
        noteItems.forEach(item => write(`  •  ${item}`, margin + 5, { size: 9, style: 'italic', color: C.muted, lineH: 4.5 }))
      }
    }
  }

  // ── Footer on every page ──────────────────────────────────────────────────────
  const total = pdf.getNumberOfPages()
  for (let pg = 1; pg <= total; pg++) {
    pdf.setPage(pg)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...C.muted)
    pdf.text(
      `${itin.from_city} -> ${itin.to_city} Trip Itinerary`,
      margin,
      pageH - 7,
    )
    pdf.text(`Page ${pg} of ${total}`, pageW / 2, pageH - 7, { align: 'center' })
    pdf.text('Generated by Multi-Agent Trip Planner', pageW - margin, pageH - 7, { align: 'right' })
  }

  pdf.save(`${safeFilename(itin)}.pdf`)
}
