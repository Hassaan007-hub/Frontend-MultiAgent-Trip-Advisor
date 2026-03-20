import { useState } from 'react'

interface Props {
  data: unknown
}

export function RawJsonViewer({ data }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-900 hover:bg-slate-100"
      >
        <span>Raw JSON (developer view)</span>
        <span className="text-slate-500">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-slate-900 px-3 py-2 text-[11px] text-slate-100">
{JSON.stringify(data, null, 2)}
        </pre>
      )}
    </section>
  )
}

