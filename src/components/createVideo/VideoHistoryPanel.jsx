// import { useEffect } from 'react'
// import { Video } from 'lucide-react'
// const STATUS_DOT = {
//   succeeded: 'bg-green-400',
//   processing: 'bg-blue-400 animate-pulse',
//   queued: 'bg-yellow-400 animate-pulse',
//   failed: 'bg-red-400',
// }

// // Label rút gọn cho mode
// const MODE_LABEL = {
//   std: 'Std',
//   pro: 'Pro',
//   '4k': '4K',
// }

// export default function VideoHistoryPanel({ history, loading, selectedId, onSelect }) {
//   return (
//     <section className="flex w-[88px] flex-col overflow-hidden border-l border-slate-800/80 bg-slate-900/40 backdrop-blur-lg">
//       <div className="scrollbar-hide flex flex-col gap-2 overflow-y-auto p-2">
//         {loading ? (
//           Array.from({ length: 5 }).map((_, i) => (
//             <div key={i} className="aspect-square w-full animate-pulse rounded-lg bg-slate-800" />
//           ))
//         ) : history.length === 0 ? (
//           <div className="flex flex-col items-center gap-1 pt-4">
//             {/* <span className="material-symbols-outlined text-2xl text-slate-600">movie</span> */}
//             <Video className="h-6 w-6 text-slate-600" />
//             <p className="text-center text-[9px] text-slate-600">Chưa có video</p>
//           </div>
//         ) : (
//           history.map((item) => (
//             <button
//               key={item.id}
//               type="button"
//               onClick={() => onSelect(item)}
//               className={`group relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
//                 selectedId === item.id
//                   ? 'border-indigo-500'
//                   : 'border-transparent hover:border-slate-600'
//               }`}
//             >
//               {/* Thumbnail */}
//               {item.thumbnailUrl ? (
//                 <img
//                   src={item.thumbnailUrl}
//                   alt="thumbnail"
//                   className="h-full w-full object-cover"
//                 />
//               ) : (
//                 <div className="flex h-full w-full items-center justify-center bg-slate-800">
//                   {/* <span className="material-symbols-outlined text-xl text-slate-600">movie</span> */}
//                   <Video className="h-5 w-5 text-slate-600" />
//                 </div>
//               )}

//               {/* Status dot */}
//               <span className={`absolute right-1 top-1 h-2 w-2 rounded-full ${STATUS_DOT[item.status] ?? 'bg-slate-500'}`} />
//             </button>
//           ))
//         )}
//       </div>
//     </section>
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