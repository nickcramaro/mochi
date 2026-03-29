interface Props {
  label: string
  value: number
  color: string
}

export default function TraitBar({ label, value, color }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400 w-24 text-right">{label}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-gray-500 w-10">{(value * 100).toFixed(0)}%</span>
    </div>
  )
}
