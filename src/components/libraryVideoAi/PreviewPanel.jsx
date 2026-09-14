import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function PreviewPanel({ item, onPrev, onNext }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative p-8 gap-4 overflow-hidden bg-gray-50">
      <button
        onClick={onPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors z-10"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={onNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors z-10"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="max-w-3xl w-full max-h-[70vh] rounded-xl overflow-hidden bg-black flex items-center justify-center">
        {item.type === "video" ? (
          <video
            key={item.id}
            src={item.videoSrc || item.src}
            controls
            autoPlay
            className="w-full h-full max-h-[70vh] object-contain"
          />
        ) : (
          <img
            src={item.src}
            alt={item.alt}
            className="w-full h-full max-h-[70vh] object-contain"
          />
        )}
      </div>
    </div>
  )
}