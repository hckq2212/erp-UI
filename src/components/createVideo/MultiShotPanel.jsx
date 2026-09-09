// // import { useRef, useState } from 'react'

// // /**
// //  * MultiShotPanel
// //  * @param {Array}  shots           - [{id, prompt, duration}]
// //  * @param {Function} onShotsChange - (newShots) => void
// //  * @param {number} totalDuration   - tổng thời lượng video (giây)
// //  */
// // import { GripVertical, Minus, Plus, Trash2 } from 'lucide-react'

// // export default function MultiShotPanel({ shots, onShotsChange, totalDuration }) {
// //   const dragIndexRef = useRef(null)
// //   const [dragOverIndex, setDragOverIndex] = useState(null)

// //   // ─── tổng giây đang dùng ────────────────────────────────────────────────
// //   const usedDuration = shots.reduce((sum, s) => sum + s.duration, 0)
// //   const isOverLimit = usedDuration > totalDuration

// //   // ─── cập nhật 1 field của shot ──────────────────────────────────────────
// //   const updateShot = (index, field, value) => {
// //     onShotsChange(shots.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
// //   }

// //   // ─── xoá shot ───────────────────────────────────────────────────────────
// //   const removeShot = (index) => {
// //     if (shots.length <= 1) return
// //     onShotsChange(shots.filter((_, i) => i !== index))
// //   }

// //   // ─── thêm shot mới ──────────────────────────────────────────────────────
// //   const addShot = () => {
// //     const remaining = Math.max(1, totalDuration - usedDuration)
// //     const newDuration = Math.min(remaining, 1)
// //     onShotsChange([
// //       ...shots,
// //       { id: Date.now(), prompt: '', duration: newDuration },
// //     ])
// //   }

// //   // ─── drag & drop ────────────────────────────────────────────────────────
// //   const handleDragStart = (e, index) => {
// //     dragIndexRef.current = index
// //     e.dataTransfer.effectAllowed = 'move'
// //   }

// //   const handleDragOver = (e, index) => {
// //     e.preventDefault()
// //     e.dataTransfer.dropEffect = 'move'
// //     if (dragOverIndex !== index) setDragOverIndex(index)
// //   }

// //   const handleDrop = (e, index) => {
// //     e.preventDefault()
// //     const from = dragIndexRef.current
// //     if (from === null || from === index) return
// //     const updated = [...shots]
// //     const [moved] = updated.splice(from, 1)
// //     updated.splice(index, 0, moved)
// //     onShotsChange(updated)
// //     dragIndexRef.current = null
// //     setDragOverIndex(null)
// //   }

// //   const handleDragEnd = () => {
// //     dragIndexRef.current = null
// //     setDragOverIndex(null)
// //   }

// //   // ─── render ─────────────────────────────────────────────────────────────
// //   return (
// //     <div className="flex flex-col gap-2">
// //       {shots.map((shot, index) => (
// //         <div
// //           key={shot.id}
// //           draggable
// //           onDragStart={(e) => handleDragStart(e, index)}
// //           onDragOver={(e) => handleDragOver(e, index)}
// //           onDrop={(e) => handleDrop(e, index)}
// //           onDragEnd={handleDragEnd}
// //           className={`rounded-xl border bg-slate-800/80 transition-all duration-150 ${
// //             dragOverIndex === index && dragIndexRef.current !== index
// //               ? 'border-indigo-500 shadow-[0_0_0_1px_rgba(99,102,241,0.4)] scale-[1.01]'
// //               : 'border-slate-700'
// //           }`}
// //         >
// //           {/* ── Shot header ── */}
// //           <div className="flex items-center gap-2 px-3 py-2">
// //             {/* drag handle */}
// //             {/* <span
// //               className="material-symbols-outlined cursor-grab select-none text-[18px] text-slate-500 active:cursor-grabbing"
// //               title="Kéo để sắp xếp"
// //             >
// //               drag_indicator
// //             </span> */}
// //             <GripVertical className="h-[18px] w-[18px] cursor-grab select-none text-slate-500 active:cursor-grabbing" />

// //             <span className="text-xs font-semibold text-slate-300">
// //               Shot {index + 1}
// //             </span>

// //             {/* duration input */}
// //             <div className="ml-auto flex items-center gap-1.5">
// //               <button
// //                 type="button"
// //                 onClick={() => updateShot(index, 'duration', Math.max(1, shot.duration - 1))}
// //                 className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-700 transition"
// //               >
// //                 {/* <span className="material-symbols-outlined text-[14px]">remove</span> */}
// //                 <Minus className="h-3.5 w-3.5" />
// //               </button>
// //               <input
// //                 type="number"
// //                 min={1}
// //                 max={totalDuration}
// //                 value={shot.duration}
// //                 onChange={(e) => {
// //                   const v = Math.max(1, Number(e.target.value))
// //                   updateShot(index, 'duration', v)
// //                 }}
// //                 className="w-10 rounded-md border border-slate-600 bg-slate-700 py-0.5 text-center text-xs font-semibold text-white outline-none focus:border-indigo-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
// //               />
// //               <button
// //                 type="button"
// //                 onClick={() => updateShot(index, 'duration', shot.duration + 1)}
// //                 className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-700 transition"
// //               >
// //                 {/* <span className="material-symbols-outlined text-[14px]">add</span> */}
// //                 <Plus className="h-3.5 w-3.5" />
// //               </button>
// //               <span className="text-[11px] text-slate-400">s</span>
// //             </div>

// //             {/* delete */}
// //             <button
// //               type="button"
// //               onClick={() => removeShot(index)}
// //               disabled={shots.length <= 1}
// //               className="ml-1 flex h-6 w-6 items-center justify-center rounded text-slate-600 transition hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed"
// //             >
// //               {/* <span className="material-symbols-outlined text-[16px]">delete</span> */}
// //               <Trash2 className="h-4 w-4" />
// //             </button>
// //           </div>

// //           {/* ── Shot prompt textarea ── */}
// //           <textarea
// //             value={shot.prompt}
// //             onChange={(e) => updateShot(index, 'prompt', e.target.value)}
// //             rows={3}
// //             className="w-full resize-none rounded-b-xl border-t border-slate-700/60 bg-transparent px-3 py-2.5 font-mono text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:bg-slate-700/20 transition"
// //             placeholder={`Mô tả hành động cho shot ${index + 1}...`}
// //           />
// //         </div>
// //       ))}

// //       {/* ── Thêm shot ── */}
// //       <button
// //         type="button"
// //         onClick={addShot}
// //         className="flex items-center gap-2 rounded-lg border border-dashed border-slate-600 px-3 py-2 text-xs text-slate-400 transition hover:border-indigo-500/50 hover:text-indigo-400"
// //       >
// //         {/* <span className="material-symbols-outlined text-[16px]">add</span> */}
// //         <Plus className="h-4 w-4" />
// //         Thêm Shot
// //       </button>

// //       {/* ── Duration summary ── */}
// //       <div
// //         className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition ${
// //           isOverLimit
// //             ? 'bg-red-500/10 border border-red-500/30'
// //             : 'bg-slate-800/60'
// //         }`}
// //       >
// //         <span className={isOverLimit ? 'text-red-400 font-medium' : 'text-slate-400'}>
// //           Tổng thời gian shot
// //         </span>
// //         <span className={`font-semibold tabular-nums ${isOverLimit ? 'text-red-400' : 'text-slate-300'}`}>
// //           {usedDuration}s / {totalDuration}s
// //           {isOverLimit && (
// //             <span className="ml-2 text-red-400">
// //               (vượt {usedDuration - totalDuration}s)
// //             </span>
// //           )}
// //         </span>
// //       </div>
// //     </div>
// //   )
// // }

// import { useRef, useState } from 'react'

// /**
//  * MultiShotPanel
//  * @param {Array}  shots           - [{id, prompt, duration}]
//  * @param {Function} onShotsChange - (newShots) => void
//  * @param {number} totalDuration   - tổng thời lượng video (giây)
//  */
// import { GripVertical, Minus, Plus, Trash2 } from 'lucide-react'

// export default function MultiShotPanel({ shots, onShotsChange, totalDuration }) {
//   const dragIndexRef = useRef(null)
//   const [dragOverIndex, setDragOverIndex] = useState(null)

//   // ─── tổng giây đang dùng ────────────────────────────────────────────────
//   const usedDuration = shots.reduce((sum, s) => sum + s.duration, 0)
//   const isOverLimit = usedDuration > totalDuration

//   // ─── cập nhật 1 field của shot ──────────────────────────────────────────
//   const updateShot = (index, field, value) => {
//     onShotsChange(shots.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
//   }

//   // ─── xoá shot ───────────────────────────────────────────────────────────
//   const removeShot = (index) => {
//     if (shots.length <= 1) return
//     onShotsChange(shots.filter((_, i) => i !== index))
//   }

//   // ─── thêm shot mới ──────────────────────────────────────────────────────
//   const addShot = () => {
//     const remaining = Math.max(1, totalDuration - usedDuration)
//     const newDuration = Math.min(remaining, 1)
//     onShotsChange([
//       ...shots,
//       { id: Date.now(), prompt: '', duration: newDuration },
//     ])
//   }

//   // ─── drag & drop ────────────────────────────────────────────────────────
//   const handleDragStart = (e, index) => {
//     dragIndexRef.current = index
//     e.dataTransfer.effectAllowed = 'move'
//   }

//   const handleDragOver = (e, index) => {
//     e.preventDefault()
//     e.dataTransfer.dropEffect = 'move'
//     if (dragOverIndex !== index) setDragOverIndex(index)
//   }

//   const handleDrop = (e, index) => {
//     e.preventDefault()
//     const from = dragIndexRef.current
//     if (from === null || from === index) return
//     const updated = [...shots]
//     const [moved] = updated.splice(from, 1)
//     updated.splice(index, 0, moved)
//     onShotsChange(updated)
//     dragIndexRef.current = null
//     setDragOverIndex(null)
//   }

//   const handleDragEnd = () => {
//     dragIndexRef.current = null
//     setDragOverIndex(null)
//   }

//   // ─── render ─────────────────────────────────────────────────────────────
//   return (
//     <div className="flex flex-col gap-2">
//       {shots.map((shot, index) => (
//         <div
//           key={shot.id}
//           draggable
//           onDragStart={(e) => handleDragStart(e, index)}
//           onDragOver={(e) => handleDragOver(e, index)}
//           onDrop={(e) => handleDrop(e, index)}
//           onDragEnd={handleDragEnd}
//           className={`rounded-xl border bg-white transition-all duration-150 ${
//             dragOverIndex === index && dragIndexRef.current !== index
//               ? 'border-blue-500 shadow-[0_0_0_1px_rgba(37,99,235,0.35)] scale-[1.01]'
//               : 'border-gray-200'
//           }`}
//         >
//           {/* ── Shot header ── */}
//           <div className="flex items-center gap-2 px-3 py-2">
//             {/* drag handle */}
//             <GripVertical className="h-[18px] w-[18px] cursor-grab select-none text-gray-400 active:cursor-grabbing" />

//             <span className="text-xs font-semibold text-gray-500">
//               Shot {index + 1}
//             </span>

//             {/* duration input */}
//             <div className="ml-auto flex items-center gap-1.5">
//               <button
//                 type="button"
//                 onClick={() => updateShot(index, 'duration', Math.max(1, shot.duration - 1))}
//                 className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
//               >
//                 <Minus className="h-3.5 w-3.5" />
//               </button>
//               <input
//                 type="number"
//                 min={1}
//                 max={totalDuration}
//                 value={shot.duration}
//                 onChange={(e) => {
//                   const v = Math.max(1, Number(e.target.value))
//                   updateShot(index, 'duration', v)
//                 }}
//                 className="w-10 rounded-md border border-gray-300 bg-gray-50 py-0.5 text-center text-xs font-semibold text-gray-900 outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
//               />
//               <button
//                 type="button"
//                 onClick={() => updateShot(index, 'duration', shot.duration + 1)}
//                 className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
//               >
//                 <Plus className="h-3.5 w-3.5" />
//               </button>
//               <span className="text-[11px] text-gray-400">s</span>
//             </div>

//             {/* delete */}
//             <button
//               type="button"
//               onClick={() => removeShot(index)}
//               disabled={shots.length <= 1}
//               className="ml-1 flex h-6 w-6 items-center justify-center rounded text-gray-300 transition hover:text-red-500 disabled:opacity-20 disabled:cursor-not-allowed"
//             >
//               <Trash2 className="h-4 w-4" />
//             </button>
//           </div>

//           {/* ── Shot prompt textarea ── */}
//           <textarea
//             value={shot.prompt}
//             onChange={(e) => updateShot(index, 'prompt', e.target.value)}
//             rows={3}
//             className="w-full resize-none rounded-b-xl border-t border-gray-200 bg-transparent px-3 py-2.5 font-mono text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400 focus:bg-gray-50 transition"
//             placeholder={`Mô tả hành động cho shot ${index + 1}...`}
//           />
//         </div>
//       ))}

//       {/* ── Thêm shot ── */}
//       <button
//         type="button"
//         onClick={addShot}
//         className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-400 transition hover:border-blue-400 hover:text-blue-600"
//       >
//         <Plus className="h-4 w-4" />
//         Thêm Shot
//       </button>

//       {/* ── Duration summary ── */}
//       <div
//         className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition ${
//           isOverLimit
//             ? 'bg-red-50 border border-red-200'
//             : 'bg-gray-50'
//         }`}
//       >
//         <span className={isOverLimit ? 'text-red-600 font-medium' : 'text-gray-500'}>
//           Tổng thời gian shot
//         </span>
//         <span className={`font-semibold tabular-nums ${isOverLimit ? 'text-red-600' : 'text-gray-700'}`}>
//           {usedDuration}s / {totalDuration}s
//           {isOverLimit && (
//             <span className="ml-2 text-red-600">
//               (vượt {usedDuration - totalDuration}s)
//             </span>
//           )}
//         </span>
//       </div>
//     </div>
//   )
// }

import { useEffect } from 'react'
import { Video } from 'lucide-react'
const STATUS_DOT = {
  succeeded: 'bg-emerald-500',
  processing: 'bg-blue-500 animate-pulse',
  queued: 'bg-yellow-500 animate-pulse',
  failed: 'bg-red-500',
}

// Label rút gọn cho mode
const MODE_LABEL = {
  std: 'Std',
  pro: 'Pro',
  '4k': '4K',
}

export default function VideoHistoryPanel({ history, loading, selectedId, onSelect }) {
  return (
    <section className="flex w-[88px] flex-col overflow-hidden border-l border-gray-200 bg-white">
      <div className="scrollbar-hide flex flex-col gap-2 overflow-y-auto p-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-square w-full animate-pulse rounded-lg bg-gray-100" />
          ))
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center gap-1 pt-4">
            <Video className="h-6 w-6 text-gray-300" />
            <p className="text-center text-[9px] text-gray-400">Chưa có video</p>
          </div>
        ) : (
          history.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className={`group relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                selectedId === item.id
                  ? 'border-blue-500'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              {/* Thumbnail */}
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt="thumbnail"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <Video className="h-5 w-5 text-gray-300" />
                </div>
              )}

              {/* Status dot */}
              <span className={`absolute right-1 top-1 h-2 w-2 rounded-full ring-2 ring-white ${STATUS_DOT[item.status] ?? 'bg-gray-300'}`} />
            </button>
          ))
        )}
      </div>
    </section>
  )
}