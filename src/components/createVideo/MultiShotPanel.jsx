import { useRef, useState } from 'react'
import { GripVertical, Minus, Plus, Trash2 } from 'lucide-react'

/**
 * MultiShotPanel
 * @param {Array}  shots           - [{id, prompt, duration}]
 * @param {Function} onShotsChange - (newShots) => void
 * @param {number} totalDuration   - tổng thời lượng video (giây)
 */
export default function MultiShotPanel({ shots, onShotsChange, totalDuration }) {
  const dragIndexRef = useRef(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const usedDuration = shots.reduce((sum, s) => sum + s.duration, 0)
  const isOverLimit = usedDuration > totalDuration

  const updateShot = (index, field, value) => {
    onShotsChange(shots.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const removeShot = (index) => {
    if (shots.length <= 1) return
    onShotsChange(shots.filter((_, i) => i !== index))
  }

  const addShot = () => {
    const remaining = Math.max(1, totalDuration - usedDuration)
    const newDuration = Math.min(remaining, 1)
    onShotsChange([...shots, { id: Date.now(), prompt: '', duration: newDuration }])
  }

  const handleDragStart = (e, index) => {
    dragIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) setDragOverIndex(index)
  }

  const handleDrop = (e, index) => {
    e.preventDefault()
    const from = dragIndexRef.current
    if (from === null || from === index) return
    const updated = [...shots]
    const [moved] = updated.splice(from, 1)
    updated.splice(index, 0, moved)
    onShotsChange(updated)
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  return (
    <div className="flex flex-col gap-2">
      {shots.map((shot, index) => (
        <div
          key={shot.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`rounded-xl border bg-white transition-all duration-150 ${
            dragOverIndex === index && dragIndexRef.current !== index
              ? 'border-blue-500 shadow-[0_0_0_1px_rgba(37,99,235,0.35)] scale-[1.01]'
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 px-3 py-2">
            <GripVertical className="h-[18px] w-[18px] cursor-grab select-none text-gray-400 active:cursor-grabbing" />
            <span className="text-xs font-semibold text-gray-500">Shot {index + 1}</span>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => updateShot(index, 'duration', Math.max(1, shot.duration - 1))}
                className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                min={1}
                max={totalDuration}
                value={shot.duration}
                onChange={(e) => updateShot(index, 'duration', Math.max(1, Number(e.target.value)))}
                className="w-10 rounded-md border border-gray-300 bg-gray-50 py-0.5 text-center text-xs font-semibold text-gray-900 outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => updateShot(index, 'duration', shot.duration + 1)}
                className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <span className="text-[11px] text-gray-400">s</span>
            </div>

            <button
              type="button"
              onClick={() => removeShot(index)}
              disabled={shots.length <= 1}
              className="ml-1 flex h-6 w-6 items-center justify-center rounded text-gray-300 transition hover:text-red-500 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <textarea
            value={shot.prompt}
            onChange={(e) => updateShot(index, 'prompt', e.target.value)}
            rows={3}
            className="w-full resize-none rounded-b-xl border-t border-gray-200 bg-transparent px-3 py-2.5 font-mono text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400 focus:bg-gray-50 transition"
            placeholder={`Mô tả hành động cho shot ${index + 1}...`}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addShot}
        className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-400 transition hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-4 w-4" />
        Thêm Shot
      </button>

      <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition ${isOverLimit ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
        <span className={isOverLimit ? 'text-red-600 font-medium' : 'text-gray-500'}>Tổng thời gian shot</span>
        <span className={`font-semibold tabular-nums ${isOverLimit ? 'text-red-600' : 'text-gray-700'}`}>
          {usedDuration}s / {totalDuration}s
          {isOverLimit && <span className="ml-2 text-red-600">(vượt {usedDuration - totalDuration}s)</span>}
        </span>
      </div>
    </div>
  )
}