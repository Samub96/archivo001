interface ProgressBarProps {
  solved: number
  total: number
  showLabel?: boolean
}

export function ProgressBar({ solved, total, showLabel = true }: ProgressBarProps) {
  const percent = total === 0 ? 0 : Math.round((solved / total) * 100)

  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-2 flex items-center justify-between font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
          <span>Recovered data</span>
          <span className="text-terminal">
            {String(solved).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
        </div>
      )}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-tech/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={solved}
        aria-label={`${solved} de ${total} desafíos resueltos`}
      >
        <div
          className="h-full rounded-full bg-terminal transition-[width] duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
