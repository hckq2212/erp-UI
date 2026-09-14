import { Image as ImageIcon, Film, Copy, Check } from 'lucide-react'

export default function InfoPanel({ item, onCopyPrompt, promptCopied }) {
  return (
    <div className="w-96 shrink-0 border-l border-gray-200 overflow-y-auto p-5 flex flex-col gap-5 scrollbar-hide bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-900 font-medium text-sm">
          {item.type === "video"
            ? <Film className="h-[18px] w-[18px] text-gray-400" />
            : <ImageIcon className="h-[18px] w-[18px] text-gray-400" />}
          {item.category === "element" ? item.alt : (item.type === "video" ? "Video" : "Ảnh")}
        </div>
      </div>

      {item.createdAt && <p className="text-xs text-gray-400 -mt-3">{item.createdAt}</p>}

      {item.startImages?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Frames</h3>
          <div className="flex items-center gap-2">
            {item.startImages.map((src, idx) => (
              <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {item.prompt && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {item.category === "element" ? "Mô tả" : "Prompt"}
            </h3>
            <button onClick={() => onCopyPrompt(item.prompt)} className="text-gray-400 hover:text-gray-900 transition-colors">
              {promptCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{item.prompt}</p>
        </div>
      )}

      {(item.provider || item.model || item.resolution) && (
        <div className="flex items-center gap-2 flex-wrap">
          {item.provider && (
            <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-md">
              {item.provider}
            </span>
          )}
          {item.model && (
            <span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md">
              {item.model}
            </span>
          )}
          {item.resolution && (
            <span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md">
              {item.resolution}
            </span>
          )}
        </div>
      )}
    </div>
  )
}