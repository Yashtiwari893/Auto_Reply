'use client'

type Bar = { day: string; count: number }

export default function MiniBarChart({ data }: { data: Bar[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="flex items-end gap-2 h-24">
      {data.map(({ day, count }) => (
        <div key={day} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500">{count > 0 ? count : ''}</span>
          <div className="w-full flex items-end" style={{ height: '64px' }}>
            <div
              className="w-full rounded-t transition-all duration-300 min-h-[2px]"
              style={{
                height: `${Math.max((count / max) * 64, count > 0 ? 4 : 2)}px`,
                backgroundColor: '#09AF72',
              }}
            />
          </div>
          <span className="text-xs text-gray-400">{day}</span>
        </div>
      ))}
    </div>
  )
}
