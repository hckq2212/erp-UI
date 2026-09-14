// import { useEffect, useRef, useState } from "react"
// import { VIDEO_PRICING } from "../../utils/videoPricing"
// import {
//   RESOLUTION_TO_MODE,
//   KLING_RESOLUTIONS,
//   BYTEPLUS_RESOLUTIONS,
//   BYTEPLUS_RATIOS,
// } from "../../utils/videoOptions"
// import { Hexagon, ChevronDown, ChevronUp, Minus, Plus, VolumeX, Volume2 } from 'lucide-react'

// export default function CustomSettingVideo({
//   modelCode,
//   isByteplus = false,     // ← NEW: true khi model thuộc provider BytePlus
//   resolution,
//   setResolution,
//   ratio,                  // ← NEW: chỉ dùng khi isByteplus
//   setRatio,               // ← NEW
//   length,
//   setLength,
//   nativeAudio,
//   setNativeAudio,
// }) {
//   const [settingsOpen, setSettingsOpen] = useState(false)
//   const settingRef = useRef(null)

//   const pricing = VIDEO_PRICING[modelCode]

//   // ── Resolution options theo provider ──────────────────────────────
//   const availableResolutions = isByteplus
//     ? BYTEPLUS_RESOLUTIONS
//     : (!pricing
//         ? KLING_RESOLUTIONS
//         : KLING_RESOLUTIONS.filter((r) => {
//             const mode = RESOLUTION_TO_MODE[r.toLowerCase()]
//             return !!pricing.video?.[mode]
//           }))

//   // ── Audio khả dụng ──────────────────────────────────────────────
//   // BytePlus (Seedance 2.0 series & 1.5 Pro): generate_audio luôn hỗ trợ → cho phép toggle tự do
//   // Kling: phụ thuộc bảng giá pricing (per mode)
//   const audioAllowed = isByteplus
//     ? true
//     : (() => {
//         const mode = RESOLUTION_TO_MODE[resolution?.toLowerCase()] ?? "pro"
//         return !!pricing?.video?.[mode]?.withAudio
//       })()

//   // ── Duration range theo provider ──────────────────────────────────
//   const durationMin = isByteplus ? 4 : 3
//   const durationMax = isByteplus ? 15 : 15

//   // ── auto-correct invalid combos khi đổi model ─────────────────────
//   useEffect(() => {
//     if (!availableResolutions.includes(resolution)) {
//       setResolution(availableResolutions[0] ?? "1080p")
//     }
//   }, [modelCode]) // eslint-disable-line react-hooks/exhaustive-deps

//   useEffect(() => {
//     if (!audioAllowed && nativeAudio) {
//       setNativeAudio(false)
//     }
//   }, [audioAllowed]) // eslint-disable-line react-hooks/exhaustive-deps

//   useEffect(() => {
//     if (length < durationMin) setLength(durationMin)
//     if (length > durationMax) setLength(durationMax)
//   }, [modelCode]) // eslint-disable-line react-hooks/exhaustive-deps

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (!settingRef.current) return
//       if (!settingRef.current.contains(event.target)) setSettingsOpen(false)
//     }
//     document.addEventListener("mousedown", handleClickOutside)
//     return () => document.removeEventListener("mousedown", handleClickOutside)
//   }, [])

//   return (
//     <div ref={settingRef} className="relative">

//       {/* ── Trigger button ── */}
//       <button
//         type="button"
//         onClick={() => setSettingsOpen((prev) => !prev)}
//         className="flex h-11 items-center gap-0.5 rounded-lg border border-slate-700 bg-slate-900 px-1 text-[11px] font-semibold text-white transition-all hover:bg-slate-800"
//       >
//         {/* <span className="material-symbols-outlined text-[14px]">hexagon</span> */}
//         <Hexagon className="h-3.5 w-3.5" />
//         <span>
//           {resolution}
//           {isByteplus && ratio ? ` · ${ratio}` : ''} · {length}s · {nativeAudio ? "On" : "Off"}
//         </span>
//         <span className="material-symbols-outlined text-[14px]">
//           {/* {settingsOpen ? "keyboard_arrow_down" : "keyboard_arrow_up"} */}
//           {settingsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
//         </span>
//       </button>

//       {/* ── Settings popup ── */}
//       {settingsOpen && (
//         <div className="absolute bottom-full left-0 z-50 mb-3 w-[390px] rounded-xl border border-slate-700 bg-[#18191d] p-4 text-white shadow-2xl">

//           {/* Resolution / Mode */}
//           <div className="mb-5">
//             <p className="mb-2 text-sm text-slate-300">Mode</p>
//             <div
//               className="overflow-hidden rounded-lg bg-[#222328]"
//               style={{ display: "grid", gridTemplateColumns: `repeat(${availableResolutions.length}, 1fr)` }}
//             >
//               {availableResolutions.map((item) => (
//                 <button
//                   key={item}
//                   type="button"
//                   onClick={() => setResolution(item)}
//                   className={`relative py-3 text-sm font-semibold transition ${
//                     resolution === item
//                       ? "bg-[#3a3b40] text-white"
//                       : "text-slate-300 hover:bg-white/5"
//                   }`}
//                 >
//                   {item}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Ratio — chỉ hiện với BytePlus/Seedance */}
//           {isByteplus && (
//             <div className="mb-5">
//               <p className="mb-2 text-sm text-slate-300">Ratio</p>
//               <div className="grid grid-cols-4 gap-1.5">
//                 {BYTEPLUS_RATIOS.map(({ label, value }) => (
//                   <button
//                     key={value}
//                     type="button"
//                     onClick={() => setRatio(value)}
//                     className={`rounded-lg py-2 text-xs font-semibold transition ${
//                       ratio === value
//                         ? "bg-[#3a3b40] text-white"
//                         : "bg-[#222328] text-slate-300 hover:bg-white/5"
//                     }`}
//                   >
//                     {label}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Duration */}
//           <div className="mb-5">
//             <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
//               <span>Duration</span>
//               <span className="font-semibold text-white">{length}s</span>
//             </div>
//             <div className="flex items-center gap-3">
//               <span className="text-sm text-slate-400">{durationMin}s</span>
//               <input
//                 type="range"
//                 min={durationMin}
//                 max={durationMax}
//                 value={length}
//                 onChange={(e) => setLength(Number(e.target.value))}
//                 className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-slate-700 accent-white"
//               />
//               <span className="text-sm text-slate-400">{durationMax}s</span>
//             </div>
//           </div>

//           {/* Sound / generate_audio */}
//           <div className="mb-5">
//             <p className="mb-2 text-sm text-slate-300">Sound</p>
//             <div
//               className="overflow-hidden rounded-lg bg-[#222328]"
//               style={{ display: "grid", gridTemplateColumns: audioAllowed ? "1fr 1fr" : "1fr" }}
//             >
//               {/* Off — always shown */}
//               <button
//                 type="button"
//                 onClick={() => setNativeAudio(false)}
//                 className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold transition ${
//                   !nativeAudio
//                     ? "bg-[#3a3b40] text-white"
//                     : "text-slate-400 hover:bg-white/5"
//                 }`}
//               >
//                 {/* <span className="material-symbols-outlined text-[16px]">volume_off</span> */}
//                 <VolumeX className="h-4 w-4" />
//                 Off
//               </button>

//               {/* On — only when audioAllowed */}
//               {audioAllowed && (
//                 <button
//                   type="button"
//                   onClick={() => setNativeAudio(true)}
//                   className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold transition ${
//                     nativeAudio
//                       ? "bg-[#3a3b40] text-white"
//                       : "text-slate-400 hover:bg-white/5"
//                   }`}
//                 >
//                   {/* <span className="material-symbols-outlined text-[16px]">volume_up</span> */}
//                   <Volume2 className="h-4 w-4" />
//                   On
//                 </button>
//               )}
//             </div>
//           </div>

//         </div>
//       )}
//     </div>
//   )
// }

import { useEffect, useRef, useState } from "react"
import { VIDEO_PRICING } from "../../utils/videoPricing"
import {
  RESOLUTION_TO_MODE,
  KLING_RESOLUTIONS,
  BYTEPLUS_RESOLUTIONS,
  BYTEPLUS_RATIOS,
} from "../../utils/videoOptions"
import { Hexagon, ChevronDown, ChevronUp, Minus, Plus, VolumeX, Volume2 } from 'lucide-react'

export default function CustomSettingVideo({
  modelCode,
  isByteplus = false,     // ← NEW: true khi model thuộc provider BytePlus
  resolution,
  setResolution,
  ratio,                  // ← NEW: chỉ dùng khi isByteplus
  setRatio,               // ← NEW
  length,
  setLength,
  nativeAudio,
  setNativeAudio,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingRef = useRef(null)

  const pricing = VIDEO_PRICING[modelCode]

  // ── Resolution options theo provider ──────────────────────────────
  const availableResolutions = isByteplus
    ? BYTEPLUS_RESOLUTIONS
    : (!pricing
        ? KLING_RESOLUTIONS
        : KLING_RESOLUTIONS.filter((r) => {
            const mode = RESOLUTION_TO_MODE[r.toLowerCase()]
            return !!pricing.video?.[mode]
          }))

  // ── Audio khả dụng ──────────────────────────────────────────────
  // BytePlus (Seedance 2.0 series & 1.5 Pro): generate_audio luôn hỗ trợ → cho phép toggle tự do
  // Kling: phụ thuộc bảng giá pricing (per mode)
  const audioAllowed = isByteplus
    ? true
    : (() => {
        const mode = RESOLUTION_TO_MODE[resolution?.toLowerCase()] ?? "pro"
        return !!pricing?.video?.[mode]?.withAudio
      })()

  // ── Duration range theo provider ──────────────────────────────────
  const durationMin = isByteplus ? 4 : 3
  const durationMax = isByteplus ? 15 : 15

  // ── auto-correct invalid combos khi đổi model ─────────────────────
  useEffect(() => {
    if (!availableResolutions.includes(resolution)) {
      setResolution(availableResolutions[0] ?? "1080p")
    }
  }, [modelCode]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!audioAllowed && nativeAudio) {
      setNativeAudio(false)
    }
  }, [audioAllowed]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (length < durationMin) setLength(durationMin)
    if (length > durationMax) setLength(durationMax)
  }, [modelCode]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!settingRef.current) return
      if (!settingRef.current.contains(event.target)) setSettingsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={settingRef} className="relative">

      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={() => setSettingsOpen((prev) => !prev)}
        className="flex h-11 items-center gap-0.5 rounded-lg border border-gray-300 bg-white px-1 text-[11px] font-semibold text-gray-900 transition-all hover:bg-gray-50"
      >
        <Hexagon className="h-3.5 w-3.5 text-blue-600" />
        <span>
          {resolution}
          {isByteplus && ratio ? ` · ${ratio}` : ''} · {length}s · {nativeAudio ? "On" : "Off"}
        </span>
        <span>
          {settingsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </span>
      </button>

      {/* ── Settings popup ── */}
      {settingsOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-3 w-[390px] rounded-xl border border-gray-200 bg-white p-4 text-gray-900 shadow-2xl">

          {/* Resolution / Mode */}
          <div className="mb-5">
            <p className="mb-2 text-sm text-gray-500">Mode</p>
            <div
              className="overflow-hidden rounded-lg bg-gray-100 p-1"
              style={{ display: "grid", gridTemplateColumns: `repeat(${availableResolutions.length}, 1fr)`, gap: "4px" }}
            >
              {availableResolutions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setResolution(item)}
                  className={`relative rounded-md py-2.5 text-sm font-semibold transition ${
                    resolution === item
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:bg-white/60"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Ratio — chỉ hiện với BytePlus/Seedance */}
          {isByteplus && (
            <div className="mb-5">
              <p className="mb-2 text-sm text-gray-500">Ratio</p>
              <div className="grid grid-cols-4 gap-1.5">
                {BYTEPLUS_RATIOS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRatio(value)}
                    className={`rounded-lg py-2 text-xs font-semibold transition ${
                      ratio === value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Duration */}
          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
              <span>Duration</span>
              <span className="font-semibold text-gray-900">{length}s</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{durationMin}s</span>
              <input
                type="range"
                min={durationMin}
                max={durationMax}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600"
              />
              <span className="text-sm text-gray-400">{durationMax}s</span>
            </div>
          </div>

          {/* Sound / generate_audio */}
          <div className="mb-5">
            <p className="mb-2 text-sm text-gray-500">Sound</p>
            <div
              className="overflow-hidden rounded-lg bg-gray-100 p-1"
              style={{ display: "grid", gridTemplateColumns: audioAllowed ? "1fr 1fr" : "1fr", gap: "4px" }}
            >
              {/* Off — always shown */}
              <button
                type="button"
                onClick={() => setNativeAudio(false)}
                className={`flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold transition ${
                  !nativeAudio
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:bg-white/60"
                }`}
              >
                <VolumeX className="h-4 w-4" />
                Off
              </button>

              {/* On — only when audioAllowed */}
              {audioAllowed && (
                <button
                  type="button"
                  onClick={() => setNativeAudio(true)}
                  className={`flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold transition ${
                    nativeAudio
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-400 hover:bg-white/60"
                  }`}
                >
                  <Volume2 className="h-4 w-4" />
                  On
                </button>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}