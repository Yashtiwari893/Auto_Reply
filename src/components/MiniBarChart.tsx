'use client'

type Bar = { day: string; count: number }

export default function MiniBarChart({ data }: { data: Bar[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="flex items-end gap-3 h-36 pt-4">
      {data.map(({ day, count }) => {
        const heightPct = count > 0 ? Math.max((count / max) * 100, 8) : 3
        return (
          <div key={day} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">{count > 0 ? count : ''}</span>
            <div className="w-full flex items-end rounded-t-md overflow-hidden" style={{ height: '96px' }}>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${heightPct}%`,
                  background: count > 0
                    ? 'linear-gradient(180deg, #09AF72 0%, #0A8A66 100%)'
                    : '#f0f0f0',
                }}
              />
            </div>
            <span className="text-xs text-gray-400 font-medium">{day}</span>
          </div>
        )
      })}
    </div>
  )
}
