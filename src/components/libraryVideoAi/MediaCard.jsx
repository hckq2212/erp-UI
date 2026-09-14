import { Heart, MoreHorizontal, Download, Trash2, Image as ImageIcon, Play } from 'lucide-react'

export default function MediaCard({
  item, onSelect, onToggleFavorite,
  menuOpenId, setMenuOpenId, onDownload, onDelete,
}) {
  return (
    <div
      onClick={() => onSelect(item.id)}
      className="media-card group relative bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col aspect-[4/5]"
    >
      <div className="flex-1 relative overflow-hidden bg-gray-100 flex items-center justify-center">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          src={item.src}
          alt={item.alt}
        />

        {item.status && item.status !== "succeeded" && (
          <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm">
            {item.status === "failed" ? (
              <span className="text-red-400">Lỗi</span>
            ) : (
              <>
                <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-gray-400 border-t-yellow-400" />
                <span className="text-yellow-300">Đang xử lý</span>
              </>
            )}
          </span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id) }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm bg-black/40 transition-opacity duration-200 z-10 ${
            item.favorite ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <Heart
            className={`h-[18px] w-[18px] transition-colors ${item.favorite ? "text-red-500" : "text-white hover:text-red-400"}`}
            fill={item.favorite ? 'currentColor' : 'none'}
          />
        </button>

        {item.type === "video" && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 rounded-full bg-indigo-600/90 flex items-center justify-center backdrop-blur-sm">
              <Play className="h-5 w-5 text-white ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
      </div>
      <div className="p-3 bg-white border-t border-gray-100 flex justify-between items-center shrink-0">
        {item.type === "video" ? (
          <div className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-500 font-medium">
            {item.duration}
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-500 font-medium">
            <ImageIcon className="h-3.5 w-3.5" />
            IMG
          </div>
        )}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpenId((id) => (id === item.id ? null : item.id)) }}
            className={`text-gray-400 hover:text-indigo-600 transition-colors ${
              menuOpenId === item.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <MoreHorizontal className="h-[18px] w-[18px]" />
          </button>

          {menuOpenId === item.id && (
            <>
              <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setMenuOpenId(null) }} />
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-full right-0 mb-2 w-36 rounded-lg bg-white border border-gray-200 shadow-xl z-40 overflow-hidden"
              >
                <button
                  onClick={(e) => onDownload(item, e)}
                  className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Tải xuống
                </button>

                {item.category === "element" && onDelete && (
                  <button
                    onClick={(e) => onDelete(item, e)}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
  )
}