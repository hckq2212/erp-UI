export default function ThumbnailRail({ items, selectedId, onSelect, thumbRefs }) {
  return (
    <div className="w-24 h-full shrink-0 border-l border-gray-200 flex flex-col min-h-0 overflow-hidden bg-white">
      <div className="flex-1 min-h-0 overflow-y-auto py-3 px-2 flex flex-col gap-2 scrollbar-hide">
        {items.map((item) => (
          <button
            key={item.id}
            ref={(el) => { thumbRefs.current[item.id] = el }}
            onClick={() => onSelect(item.id)}
            className={`h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
              item.id === selectedId ? "border-indigo-500" : "border-transparent hover:border-gray-300"
            }`}
          >
            <img src={item.src} alt={item.alt} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}