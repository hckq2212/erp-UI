import { useEffect, useRef, useState } from "react"
import { Hexagon, ChevronDown, ChevronUp } from "lucide-react"

export default function CustomSettingVideoMotion({
  resolution = "1080p",
  setResolution = () => {},
  nativeAudio,
  setNativeAudio,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [localNativeAudio, setLocalNativeAudio] = useState("yes")
  const settingRef = useRef(null)

  const currentNativeAudio = nativeAudio ?? localNativeAudio
  const updateNativeAudio = setNativeAudio ?? setLocalNativeAudio

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
      <button
        type="button"
        onClick={() => setSettingsOpen((prev) => !prev)}
        className="flex h-11 min-w-[130px] items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 text-[11px] font-semibold text-gray-900 shadow-sm transition-all hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <Hexagon className="h-4 w-4 text-blue-600" />
          <span>{resolution} · {currentNativeAudio === "yes" ? "On" : "Off"}</span>
        </div>
        {settingsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>

      {settingsOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-3 w-[360px] rounded-xl border border-gray-200 bg-white p-4 text-gray-900 shadow-2xl">
          <div>
            <p className="mb-2 text-sm text-gray-500">Mode</p>
            <div className="grid grid-cols-2 overflow-hidden rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setResolution("720p")}
                className={`h-10 rounded-md text-sm font-semibold transition-all ${
                  resolution === "720p" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:bg-white/60"
                }`}
              >
                720p
              </button>
              <button
                type="button"
                onClick={() => setResolution("1080p")}
                className={`h-10 rounded-md text-sm font-semibold transition-all ${
                  resolution === "1080p" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:bg-white/60"
                }`}
              >
                1080p
              </button>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm text-gray-500">Keep original sound</p>
            <div className="grid grid-cols-2 overflow-hidden rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => updateNativeAudio("no")}
                className={`h-10 rounded-md text-sm font-semibold transition-all ${
                  currentNativeAudio === "no" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:bg-white/60"
                }`}
              >
                Off
              </button>
              <button
                type="button"
                onClick={() => updateNativeAudio("yes")}
                className={`h-10 rounded-md text-sm font-semibold transition-all ${
                  currentNativeAudio === "yes" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:bg-white/60"
                }`}
              >
                On
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}