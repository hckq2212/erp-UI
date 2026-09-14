import { useState, useEffect, useRef, useMemo } from "react"
import {
  useGetLibraryAssetsQuery,
  useSetAssetFavoriteMutation,
  useUploadAssetMutation,
} from "../../api/assets"
import {
  useGetElementsHistoryQuery,
  useDeleteElementMutation,
  useSetElementFavoriteMutation,
} from "../../api/elements"
import { useCreateElement } from "../../hooks/useCreateElement"
import FilterBar from "../../components/libraryVideoAi/FilterBar"
import MediaGrid from "../../components/libraryVideoAi/MediaGrid"
import DetailOverlay from "../../components/libraryVideoAi/DetailOverlay"
import CreateElementModal from "../../components/libraryVideoAi/CreateElementModal"

function mapAssetToItem(asset) {
  const isVideo = asset.assetType === "video"
  return {
    id: asset.id,
    type: asset.assetType,
    category: asset.sourceType === "uploaded" ? "upload" : "creative",
    duration: asset.durationSeconds ? `${asset.durationSeconds}s` : undefined,
    favorite: !!asset.isFavorite,
    src: isVideo ? (asset.thumbnailUrl || asset.storedUrl) : asset.storedUrl,
    videoSrc: isVideo ? asset.storedUrl : undefined,
    alt: `${asset.assetType}_${asset.id}`,
    createdAt: asset.createdAt ? new Date(asset.createdAt).toLocaleString("vi-VN") : undefined,
    prompt: asset.prompt,
    model: asset.model,
    resolution: asset.mode,
    startImages: asset.frames,
  }
}

function mapElementToItem(el) {
  const isVideo = el.referenceType === "video_refer"
  return {
    id: `element-${el.id}`,
    rawId: el.id,
    type: isVideo ? "video" : "image",
    category: "element",
    favorite: !!el.isFavorite,
    src: isVideo ? el.videoUrl : el.frontalImageUrl,
    videoSrc: isVideo ? el.videoUrl : undefined,
    alt: el.elementName,
    createdAt: el.createdAt ? new Date(el.createdAt).toLocaleString("vi-VN") : undefined,
    status: el.status,
    prompt: el.elementDescription,
    provider: el.providerName,
  }
}

export function LibraryVideoAiPage() {
  const [activeTab, setActiveTab] = useState("Creative")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [providerFilter, setProviderFilter] = useState("all")
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [overlayMenuOpen, setOverlayMenuOpen] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)
  const [createElementOpen, setCreateElementOpen] = useState(false)
  const [hasProcessingElement, setHasProcessingElement] = useState(false)

  const thumbRefs = useRef({})
  const fileInputRef = useRef(null)
  const createElementHook = useCreateElement()

  // --- Creative / Upload ---
  const { data: assetsData, isFetching: assetsLoading } = useGetLibraryAssetsQuery(
    { tab: activeTab.toLowerCase(), type: typeFilter, favorite: favoritesOnly },
    { skip: activeTab === "Element" },
  )
  const items = useMemo(() => (assetsData?.items || []).map(mapAssetToItem), [assetsData])

  const [uploadAsset] = useUploadAssetMutation()
  const [setAssetFavorite] = useSetAssetFavoriteMutation()

  // --- Element (tự poll khi còn item đang xử lý) ---
  const { data: elementsRaw = [], isFetching: elementsLoading } = useGetElementsHistoryQuery(undefined, {
    skip: activeTab !== "Element",
    pollingInterval: hasProcessingElement ? 3000 : 0,
  })
  const elementItems = useMemo(() => elementsRaw.map(mapElementToItem), [elementsRaw])

  useEffect(() => {
    setHasProcessingElement(
      elementItems.some((i) => i.status && i.status !== "succeeded" && i.status !== "failed"),
    )
  }, [elementItems])

  const [deleteElement] = useDeleteElementMutation()
  const [setElementFavorite] = useSetElementFavoriteMutation()

  const loading = activeTab === "Element" ? elementsLoading : assetsLoading

  const handleUploadFile = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ""
    if (files.length === 0) return
    setUploading(true)
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)
        await uploadAsset(formData).unwrap()
      }
    } catch (err) {
      alert(err?.data?.message || err?.message || "Tải lên thất bại")
    } finally {
      setUploading(false)
    }
  }

  const handleCopyPrompt = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setPromptCopied(true)
      setTimeout(() => setPromptCopied(false), 1500)
    } catch (err) {
      console.error("Copy failed:", err)
    }
  }

  const handleDownload = async (item, e) => {
    e?.stopPropagation()
    setMenuOpenId(null)
    setOverlayMenuOpen(false)
    const fileName = item.name || `${item.type}_${item.id}.${item.type === "video" ? "mp4" : "png"}`
    try {
      const res = await fetch(item.src, { mode: "cors" })
      if (!res.ok) throw new Error("Network response was not ok")
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error("Download failed, opening in new tab instead:", err)
      window.open(item.src, "_blank", "noopener,noreferrer")
    }
  }

  const providers = useMemo(
    () => Array.from(new Set(elementItems.map((i) => i.provider).filter(Boolean))),
    [elementItems],
  )

  const displayItems = useMemo(() => {
    if (activeTab !== "Element") return items
    let list = elementItems
    if (typeFilter !== "all") list = list.filter((i) => i.type === typeFilter)
    if (favoritesOnly) list = list.filter((i) => i.favorite)
    if (providerFilter !== "all") list = list.filter((i) => i.provider === providerFilter)
    return list
  }, [activeTab, items, elementItems, typeFilter, favoritesOnly, providerFilter])

  const toggleFavorite = async (id) => {
    const target = displayItems.find((i) => i.id === id)
    if (!target) return
    const next = !target.favorite
    try {
      if (target.category === "element") {
        await setElementFavorite({ elementId: target.rawId, isFavorite: next }).unwrap()
      } else {
        await setAssetFavorite({ assetId: id, isFavorite: next }).unwrap()
      }
    } catch (err) {
      alert(err?.data?.message || err?.message || "Cập nhật yêu thích thất bại")
    }
  }

  const handleDeleteElement = async (item, e) => {
    e?.stopPropagation()
    setMenuOpenId(null)
    setOverlayMenuOpen(false)
    if (!window.confirm(`Xóa element "${item.alt}"? Hành động này không thể hoàn tác.`)) return
    try {
      await deleteElement(item.rawId).unwrap()
      if (selectedId === item.id) setSelectedId(null)
    } catch (err) {
      alert(err?.data?.message || err?.message || "Xóa thất bại")
    }
  }

  const filteredItems = displayItems
  const selectedItem = filteredItems.find((i) => i.id === selectedId) || null
  const selectedIndex = filteredItems.findIndex((i) => i.id === selectedId)

  useEffect(() => {
    if (!selectedId) return
    const el = thumbRefs.current[selectedId]
    if (el) el.scrollIntoView({ behavior: "instant", block: "center" })
  }, [selectedId, filteredItems])

  const goTo = (dir) => {
    if (selectedIndex === -1) return
    const nextIndex = (selectedIndex + dir + filteredItems.length) % filteredItems.length
    setSelectedId(filteredItems[nextIndex].id)
    setOverlayMenuOpen(false)
  }

  return (
    <main className="h-[calc(100vh-4rem)] flex-1 flex flex-col relative overflow-hidden bg-gray-50">
      <div className="items-center gap-4 px-8 pb-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Thư Viện Video AI</h1>
        <p className="text-gray-500 text-sm mt-1">Danh sách tài nguyên sẽ được hiển thị ở đây.</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-8 pt-0 relative">
        <FilterBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          favoritesOnly={favoritesOnly}
          setFavoritesOnly={setFavoritesOnly}
          uploading={uploading}
          fileInputRef={fileInputRef}
          onUploadFile={handleUploadFile}
          onOpenCreateElement={() => setCreateElementOpen(true)}
          providerFilter={providerFilter}
          setProviderFilter={setProviderFilter}
          providerDropdownOpen={providerDropdownOpen}
          setProviderDropdownOpen={setProviderDropdownOpen}
          providers={providers}
        />

        {loading && filteredItems.length === 0 ? (
          <div className="mt-12 flex justify-center text-sm text-gray-400">Đang tải...</div>
        ) : (
          <MediaGrid
            items={filteredItems}
            favoritesOnly={favoritesOnly}
            onSelect={setSelectedId}
            onToggleFavorite={toggleFavorite}
            menuOpenId={menuOpenId}
            setMenuOpenId={setMenuOpenId}
            onDownload={handleDownload}
            onDelete={handleDeleteElement}
          />
        )}
      </div>

      {selectedItem && (
        <DetailOverlay
          item={selectedItem}
          items={filteredItems}
          onClose={() => setSelectedId(null)}
          onPrev={() => goTo(-1)}
          onNext={() => goTo(1)}
          onSelect={setSelectedId}
          onToggleFavorite={toggleFavorite}
          onDownload={handleDownload}
          overlayMenuOpen={overlayMenuOpen}
          setOverlayMenuOpen={setOverlayMenuOpen}
          onCopyPrompt={handleCopyPrompt}
          promptCopied={promptCopied}
          thumbRefs={thumbRefs}
          onDelete={handleDeleteElement}
        />
      )}

      <CreateElementModal
        open={createElementOpen}
        onClose={() => setCreateElementOpen(false)}
        createElementHook={createElementHook}
        onCreated={() => {}}
      />
    </main>
  )
}