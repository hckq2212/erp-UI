import MediaCard from "./MediaCard"
import { SearchX } from 'lucide-react'

export default function MediaGrid({
  items, favoritesOnly, onSelect, onToggleFavorite,
  menuOpenId, setMenuOpenId, onDownload, onDelete,
}) {
  if (items.length === 0) {
    return (
      <div className="mt-12 text-center text-gray-500 flex flex-col items-center justify-center gap-4 py-12 border border-dashed border-gray-300 rounded-2xl bg-white">
        <SearchX className="h-10 w-10 opacity-40" />
        <p>
          {favoritesOnly
            ? "Bạn chưa thích tài nguyên nào."
            : "Không có tài nguyên nào phù hợp với bộ lọc."}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((item) => (
        <MediaCard
          key={item.id}
          item={item}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
          menuOpenId={menuOpenId}
          setMenuOpenId={setMenuOpenId}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}