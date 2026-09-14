import { Upload, Loader2, Plus, Heart, ChevronDown } from 'lucide-react'

export const FILTER_TABS = ["Creative", "Upload", "Element"]

export const TYPE_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "image", label: "Ảnh" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
]

const TAB_LABELS = { Creative: "Sáng tạo", Upload: "Tải lên", Element: "Element" }

export default function FilterBar({
  activeTab, setActiveTab,
  typeFilter, setTypeFilter,
  dropdownOpen, setDropdownOpen,
  favoritesOnly, setFavoritesOnly,
  uploading, fileInputRef, onUploadFile,
  onOpenCreateElement,
  providerFilter, setProviderFilter,
  providerDropdownOpen, setProviderDropdownOpen,
  providers,
}) {
  return (
    <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm flex items-center justify-between gap-3 mb-4 flex-wrap pt-2 pb-3 -mx-8 px-8 border-b border-gray-100">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-colors border ${
              activeTab === tab
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-gray-200"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {activeTab === "Upload" && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={onUploadFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Đang tải lên..." : "Tải lên"}
            </button>
          </>
        )}

        {activeTab === "Element" && (
          <button
            type="button"
            onClick={onOpenCreateElement}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tạo Element
          </button>
        )}

        <button
          type="button"
          onClick={() => setFavoritesOnly((v) => !v)}
          aria-pressed={favoritesOnly}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-semibold transition-colors select-none ${
            favoritesOnly
              ? "bg-red-50 border-red-300 text-red-600"
              : "bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300"
          }`}
        >
          <Heart className="h-4 w-4" fill={favoritesOnly ? 'currentColor' : 'none'} />
          Yêu thích
        </button>

        {activeTab === "Element" && providers.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setProviderDropdownOpen((o) => !o)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-indigo-400 transition-colors text-sm font-semibold"
            >
              {providerFilter === "all" ? "Tất cả Provider" : providerFilter}
              <ChevronDown className="h-4 w-4" />
            </button>

            {providerDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-lg bg-white border border-gray-200 shadow-xl z-40 overflow-hidden">
                <button
                  onClick={() => { setProviderFilter("all"); setProviderDropdownOpen(false) }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    providerFilter === "all" ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Tất cả Provider
                </button>
                {providers.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setProviderFilter(p); setProviderDropdownOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      providerFilter === p ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-indigo-400 transition-colors text-sm font-semibold"
          >
            {TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label}
            <ChevronDown className="h-4 w-4" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 rounded-lg bg-white border border-gray-200 shadow-xl z-40 overflow-hidden">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setTypeFilter(opt.value); setDropdownOpen(false) }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    typeFilter === opt.value ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}