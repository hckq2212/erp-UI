import { ArrowLeft, Heart, MoreHorizontal, Download, Trash2 } from 'lucide-react'
import PreviewPanel from "./PreviewPanel"
import InfoPanel from "./InfoPanel"
import ThumbnailRail from "./ThumbnailRail"

export default function DetailOverlay({
  item, items, onClose, onPrev, onNext, onSelect,
  onToggleFavorite, onDownload, onDelete,
  overlayMenuOpen, setOverlayMenuOpen, onCopyPrompt, promptCopied, thumbRefs,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col animate-in fade-in duration-150">
      <div className="flex items-center justify-between px-6 h-16 shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-gray-900 font-medium text-sm">
            {item.name || `${item.type}_${item.id}.${item.type === "video" ? "mp4" : "png"}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite(item.id)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Heart
              className={`h-5 w-5 ${item.favorite ? "text-red-500" : "text-gray-500"}`}
              fill={item.favorite ? 'currentColor' : 'none'}
            />
          </button>
          <div className="relative">
            <button
              onClick={() => setOverlayMenuOpen((o) => !o)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {overlayMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setOverlayMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-40 rounded-lg bg-white border border-gray-200 shadow-xl z-40 overflow-hidden">
                  <button
                    onClick={(e) => onDownload(item, e)}
                    className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Tải xuống
                  </button>

                  {item.category === "element" && onDelete && (
                    <button
                      onClick={(e) => onDelete(item, e)}
                      className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <PreviewPanel item={item} onPrev={onPrev} onNext={onNext} />

        {(item.category === "creative" || item.category === "element") && (
          <InfoPanel item={item} onCopyPrompt={onCopyPrompt} promptCopied={promptCopied} />
        )}

        <ThumbnailRail items={items} selectedId={item.id} onSelect={onSelect} thumbRefs={thumbRefs} />
      </div>
    </div>
  )
}