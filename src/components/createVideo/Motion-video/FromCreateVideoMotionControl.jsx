import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { ChevronDown, Video as VideoIcon, ImagePlus, History, Trash2, RotateCcw, Zap } from "lucide-react"
import CustomSettingVideoMotion from "../Motion-video/CustomSettingVideoMotion"
import AssetPickerModal from "../AssetPickerModal"
import { useGetAiModelsQuery } from "../../../api/aiModels"
import { calcMotionControlPrice } from "../../../utils/videoPricing"
import { useGetTasksQuery } from '../../../api/tasks'
import { useGetMeQuery } from '../../../api/auth'
import { getCurrentUserId } from '../../../utils/authUser'

export default function FromCreateVideoMotionControl({ createMotionControlHook }) {
  const { submitCreateMotionControl, isSubmitting, status } = createMotionControlHook

  const { data: models = [], isFetching: modelsLoading } = useGetAiModelsQuery({ supportsMotionControl: true })

  const [modelId, setModelId] = useState("")
  const [characterOrientation, setCharacterOrientation] = useState("video")
  const [prompt, setPrompt] = useState("")
  const [mode, setMode] = useState("pro")
  const [keepOriginalSound, setKeepOriginalSound] = useState("yes")

  const [referenceVideo, setReferenceVideo] = useState(null)
  const [referenceVideoPreview, setReferenceVideoPreview] = useState(null)
  const [videoDuration, setVideoDuration] = useState(null)
  const [referenceAssetId, setReferenceAssetId] = useState(null)

  const [characterImage, setCharacterImage] = useState(null)
  const [characterImagePreview, setCharacterImagePreview] = useState(null)
  const [characterAssetId, setCharacterAssetId] = useState(null)

  const [pickerTarget, setPickerTarget] = useState(null)

  const submittedBlobsRef = useRef({ char: null, video: null })
  const textareaRef = useRef(null)

  const handlePromptInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }

  const [sourceType, setSourceType] = useState('project')
  const [contextId, setContextId] = useState('')
  const [taskId, setTaskId] = useState('')
  const { data: currentUser, isLoading: currentUserLoading } = useGetMeQuery()
  const currentUserId = getCurrentUserId(currentUser)
  const { data: tasksData, isFetching: isFetchingTasks, isError: isTasksError } = useGetTasksQuery(
    {
      assigneeId: currentUserId,
      excludeStatus: 'ACCEPTED,AWAITING_REVIEW,INTERNAL_COMPLETED,COMPLETED',
      limit: 500,
    },
    { skip: !currentUserId },
  )
  const tasksLoading = currentUserLoading || isFetchingTasks
  const assignedTasks = tasksData?.data ?? []
  const contexts = useMemo(() => {
    const byId = new Map()
    assignedTasks.forEach(task => {
      const context = sourceType === 'project' ? task.project : task.opportunity
      if (context?.id) byId.set(context.id, context)
    })
    return [...byId.values()]
  }, [assignedTasks, sourceType])
  const contextTasks = assignedTasks.filter(task =>
    sourceType === 'project' ? task.project?.id === contextId : task.opportunity?.id === contextId
  )
  const projectId = sourceType === 'project' ? contextId : ''
  const opportunityId = sourceType === 'opportunity' ? contextId : ''
  const hasNoContext = !isTasksError && !tasksLoading && contexts.length === 0
  const hasNoTask = !!contextId && !tasksLoading && contextTasks.length === 0
  const selectedTask = contextTasks.find(task => String(task.id) === String(taskId))

  const selectedModelCode = models.find((m) => String(m.id) === modelId)?.code ?? ""
  const resolution = mode === "pro" ? "1080p" : "720p"

  // Chỉ tính giá khi đã có video (có duration) — tránh hiện giá "ảo" lúc chưa upload gì
  const priceInfo = useMemo(
    () => (videoDuration ? calcMotionControlPrice({ modelCode: selectedModelCode, resolution, duration: videoDuration }) : null),
    [selectedModelCode, resolution, videoDuration]
  )

  const priceColour =
    !priceInfo ? "text-gray-400" :
      priceInfo.total < 50000 ? "text-emerald-600" :
        priceInfo.total < 75000 ? "text-yellow-600" :
          priceInfo.total < 100000 ? "text-orange-600" :
            "text-red-600"

  useEffect(() => {
    if (!modelsLoading && models.length > 0 && !modelId) {
      const defaultModel =
        models.find((m) => m.code === "kling-v3") ??
        models.find((m) => m.providerCode === "kling" || m.provider_code === "kling") ??
        models[0]
      setModelId(String(defaultModel.id))
    }
  }, [models, modelsLoading, modelId])

  const resetForm = useCallback(() => {
    if (referenceVideoPreview && referenceVideoPreview !== submittedBlobsRef.current.video) {
      URL.revokeObjectURL(referenceVideoPreview)
    }
    if (characterImagePreview && characterImagePreview !== submittedBlobsRef.current.char) {
      URL.revokeObjectURL(characterImagePreview)
    }
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    setContextId('')
    setTaskId('')
    setReferenceVideo(null)
    setReferenceVideoPreview(null)
    setVideoDuration(null)
    setReferenceAssetId(null)
    setCharacterImage(null)
    setCharacterImagePreview(null)
    setCharacterAssetId(null)
    setPrompt("")
    setMode("pro")
    setKeepOriginalSound("yes")
    setCharacterOrientation("video")
    if (models.length > 0) {
      const defaultModel =
        models.find((m) => m.code === "kling-v3") ??
        models.find((m) => m.providerCode === "kling" || m.provider_code === "kling") ??
        models[0]
      setModelId(String(defaultModel.id))
    }
  }, [referenceVideoPreview, characterImagePreview, models])

  const hasAutoResetRef = useRef(false)
  const resetFormRef = useRef(null)
  useEffect(() => { resetFormRef.current = resetForm }, [resetForm])

  useEffect(() => {
    if (status === "succeeded" && !hasAutoResetRef.current) {
      hasAutoResetRef.current = true
      const t = setTimeout(() => resetFormRef.current?.(), 1500)
      return () => clearTimeout(t)
    }
    if (status === null) hasAutoResetRef.current = false
  }, [status])

  useEffect(() => {
    return () => {
      if (referenceVideoPreview && referenceVideoPreview !== submittedBlobsRef.current.video) {
        URL.revokeObjectURL(referenceVideoPreview)
      }
      if (characterImagePreview && characterImagePreview !== submittedBlobsRef.current.char) {
        URL.revokeObjectURL(characterImagePreview)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReferenceVideoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (referenceVideoPreview && referenceVideoPreview !== submittedBlobsRef.current.video) {
      URL.revokeObjectURL(referenceVideoPreview)
    }
    const url = URL.createObjectURL(file)
    const tempVid = document.createElement("video")
    tempVid.preload = "metadata"
    tempVid.onloadedmetadata = () => setVideoDuration(Math.round(tempVid.duration))
    tempVid.src = url
    setReferenceVideo(file)
    setReferenceVideoPreview(url)
    setReferenceAssetId(null)
    e.target.value = ""
  }

  const handleCharacterImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (characterImagePreview && characterImagePreview !== submittedBlobsRef.current.char) {
      URL.revokeObjectURL(characterImagePreview)
    }
    const url = URL.createObjectURL(file)
    setCharacterImage(file)
    setCharacterImagePreview(url)
    setCharacterAssetId(null)
    e.target.value = ""
  }

  const removeReferenceVideo = (e) => {
    e.preventDefault(); e.stopPropagation()
    if (referenceVideoPreview && referenceVideoPreview !== submittedBlobsRef.current.video) {
      URL.revokeObjectURL(referenceVideoPreview)
    }
    setReferenceVideo(null)
    setReferenceVideoPreview(null)
    setVideoDuration(null)
    setReferenceAssetId(null)
  }

  const removeCharacterImage = (e) => {
    e.preventDefault(); e.stopPropagation()
    if (characterImagePreview && characterImagePreview !== submittedBlobsRef.current.char) {
      URL.revokeObjectURL(characterImagePreview)
    }
    setCharacterImage(null)
    setCharacterImagePreview(null)
    setCharacterAssetId(null)
  }

  const handleSelectFromLibrary = useCallback(
    (asset) => {
      if (pickerTarget === "reference") {
        if (referenceVideoPreview && referenceVideoPreview !== submittedBlobsRef.current.video) {
          URL.revokeObjectURL(referenceVideoPreview)
        }
        setReferenceVideo(null)
        setReferenceVideoPreview(asset.storedUrl)
        setReferenceAssetId(asset.id)
        setVideoDuration(asset.durationSeconds ?? null)
      } else if (pickerTarget === "character") {
        if (characterImagePreview && characterImagePreview !== submittedBlobsRef.current.char) {
          URL.revokeObjectURL(characterImagePreview)
        }
        setCharacterImage(null)
        setCharacterImagePreview(asset.storedUrl)
        setCharacterAssetId(asset.id)
      }
      setPickerTarget(null)
    },
    [pickerTarget, referenceVideoPreview, characterImagePreview],
  )

  const handleSubmit = () => {
    if (!contextId) { alert('Vui lòng chọn cơ hội hoặc dự án'); return }
    if (!taskId) return alert('Vui lòng chọn công việc')
    if (!modelId) return alert("Vui lòng chọn model")
    if (!characterImage && !characterAssetId) return alert("Vui lòng chọn hình ảnh nhân vật")
    if (!referenceVideo && !referenceAssetId) return alert("Vui lòng chọn video tham chiếu")
    const selectedModel = models.find((m) => String(m.id) === modelId)
    submittedBlobsRef.current = { char: characterImagePreview, video: referenceVideoPreview }
    submitCreateMotionControl({
      projectId,
      opportunityId,
      taskId,
      modelId,
      modelName: selectedModel?.name ?? "",
      characterImageFile: characterImage,
      referenceVideoFile: referenceVideo,
      characterImageAssetId: characterAssetId,
      referenceVideoAssetId: referenceAssetId,
      characterImagePreview,
      referenceVideoPreview,
      prompt,
      characterOrientation,
      keepOriginalSound,
      mode,
      cost: Math.round(priceInfo?.total ?? 0),
    })
  }

  const isProcessing = status === "queued" || status === "processing"

  return (
    <section className="flex h-full w-[420px] shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white p-6">
      <div className="flex h-full min-h-0 flex-col">
        <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-5">

          <div className="grid shrink-0 grid-cols-2 gap-2">
            <button type="button" onClick={() => { setSourceType('project'); setContextId(''); setTaskId('') }} className={`rounded-lg border px-3 py-2 text-sm font-medium ${sourceType === 'project' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>Dự án</button>
            <button type="button" onClick={() => { setSourceType('opportunity'); setContextId(''); setTaskId('') }} className={`rounded-lg border px-3 py-2 text-sm font-medium ${sourceType === 'opportunity' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>Cơ hội</button>
          </div>
          <div className="shrink-0">
            {isTasksError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Không thể tải danh sách công việc được phân công. Vui lòng thử lại.
              </div>
            ) : hasNoContext ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                Bạn chưa có {sourceType === 'project' ? 'dự án' : 'cơ hội'} nào được phân công.
              </div>
            ) : (
              <div className="relative">
                <select
                  value={contextId}
                  onChange={(e) => { setContextId(e.target.value); setTaskId('') }}
                  disabled={tasksLoading}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">{tasksLoading ? 'Đang tải...' : `-- Chọn ${sourceType === 'project' ? 'dự án' : 'cơ hội'} --`}</option>
                  {contexts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            )}
          </div>

          {/* ── Task selector ── */}
          {contextId && (
            <div className="shrink-0">
              {hasNoTask ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                  Không có công việc nào đang thực hiện.
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={taskId}
                    onChange={(e) => setTaskId(e.target.value)}
                    disabled={tasksLoading}
                    className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">{tasksLoading ? 'Đang tải...' : '-- Chọn công việc --'}</option>
                    {contextTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {(t.nickname || t.name)}{t.code ? ` (${t.code})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
          )}
          {selectedTask?.opportunityServiceJob?.briefVideo && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <p className="mb-1 font-semibold">Brief khách hàng</p>
              <p className="whitespace-pre-wrap">{selectedTask.opportunityServiceJob.briefVideo}</p>
            </div>
          )}

          {/* ── Model selector ── */}
          <div className="shrink-0">
            <div className="relative">
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                disabled={modelsLoading || models.length === 0}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {modelsLoading ? (
                  <option value="">Đang tải...</option>
                ) : models.length > 0 ? (
                  models.map((m) => <option key={m.id} value={String(m.id)}>{m.name}</option>)
                ) : (
                  <option value="">Không có model hỗ trợ Motion Control</option>
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 items-start gap-3">
            {/* Reference Video */}
            <div>
              <label
                style={{ height: "180px", borderRadius: "12px 12px 0 0" }}
                className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-all hover:border-blue-400"
              >
                <input type="file" accept="video/mp4,video/quicktime,video/mov,video/*" className="hidden" onChange={handleReferenceVideoChange} />
                {referenceVideoPreview ? (
                  <video src={referenceVideoPreview} className="h-full w-full object-cover" muted loop autoPlay playsInline />
                ) : (
                  <>
                    <VideoIcon className="h-6 w-6 text-gray-400 transition-colors group-hover:text-blue-500" />
                    <span className="mt-1 text-center text-[10px] text-gray-500">Thêm video mô phỏng<br />hành động của nhân vật.</span>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPickerTarget("reference") }}
                      className="relative z-10 mt-2 flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-[10px] font-medium text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600"
                    >
                      <History className="h-3 w-3" /> History
                    </button>
                  </>
                )}
                {(referenceVideo || referenceAssetId) && (
                  <div className="absolute right-2 top-2 z-10 flex gap-1.5">
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPickerTarget("reference") }} title="Chọn từ thư viện" className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white transition-all hover:bg-black/80">
                      <History className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={removeReferenceVideo} className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white transition-all hover:bg-black/80">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-b-lg border border-t-0 border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-600">
                <input type="radio" name="orientation-match" checked={characterOrientation === "video"} onChange={() => setCharacterOrientation("video")} className="h-4 w-4 accent-blue-600" />
                <span className="truncate">Hướng nhân vật khớp với video</span>
              </label>
            </div>

            {/* Character Image */}
            <div>
              <label
                style={{ height: "180px", borderRadius: "12px 12px 0 0" }}
                className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-all hover:border-blue-400"
              >
                <input type="file" accept="image/*" className="hidden" onChange={handleCharacterImageChange} />
                {characterImagePreview ? (
                  <img src={characterImagePreview} alt="Character" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <ImagePlus className="h-6 w-6 text-gray-400 transition-colors group-hover:text-blue-500" />
                    <span className="mt-1 text-center text-[10px] text-gray-500">Thêm hình ảnh nhân vật</span>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPickerTarget("character") }}
                      className="relative z-10 mt-2 flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-[10px] font-medium text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600"
                    >
                      <History className="h-3 w-3" /> History
                    </button>
                  </>
                )}
                {(characterImage || characterAssetId) && (
                  <div className="absolute right-1 top-1 z-10 flex gap-1">
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPickerTarget("character") }} title="Chọn từ thư viện" className="rounded-full bg-black/60 p-1 text-white hover:bg-black/80">
                      <History className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={removeCharacterImage} className="rounded-full bg-black/60 p-1 text-white hover:bg-black/80">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-b-lg border border-t-0 border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-600">
                <input type="radio" name="orientation-match" checked={characterOrientation === "image"} onChange={() => setCharacterOrientation("image")} className="h-4 w-4 accent-blue-600" />
                <span className="truncate">Hướng nhân vật khớp với hình ảnh</span>
              </label>
            </div>
          </div>

          <AssetPickerModal
            open={!!pickerTarget}
            onClose={() => setPickerTarget(null)}
            onSelect={handleSelectFromLibrary}
            assetType={pickerTarget === "reference" ? "video" : "image"}
          />

          <div className="shrink-0">
            <textarea
              ref={textareaRef}
              rows={1}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onInput={handlePromptInput}
              className="min-h-[140px] w-full resize-none overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Khi hướng nhân vật khớp với video, các chuyển động phức tạp sẽ được thực hiện tốt hơn; khi hướng nhân vật khớp với hình ảnh, chuyển động máy quay sẽ được hỗ trợ tốt hơn."
            />
          </div>
        </div>

        <div className="shrink-0 space-y-3 border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2">
            <CustomSettingVideoMotion
              resolution={mode === "pro" ? "1080p" : "720p"}
              setResolution={(r) => setMode(r === "1080p" ? "pro" : "std")}
              nativeAudio={keepOriginalSound}
              setNativeAudio={setKeepOriginalSound}
            />
            <button
              type="button"
              onClick={resetForm}
              disabled={isSubmitting || isProcessing}
              title="Reset form"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition-all hover:border-gray-300 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-[minmax(0,4fr)_minmax(0,6fr)] items-center gap-3">
            <div className="flex h-[52px] min-w-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3">
              {priceInfo ? (
                <span className={`whitespace-nowrap font-mono text-xl font-black leading-none tracking-tight ${priceColour}`}>
                  {Math.round(priceInfo.total).toLocaleString("vi-VN")} VNĐ
                </span>
              ) : (
                <span className="text-center text-[11px] leading-5 text-gray-500">
                  {referenceVideo || referenceAssetId ? "Không có dữ liệu giá" : "Chọn video để xem giá"}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting || isProcessing || modelsLoading ||
                !contextId || hasNoContext ||
                !taskId ||
                !modelId ||
                (!characterImage && !characterAssetId) ||
                (!referenceVideo && !referenceAssetId)
              }
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting || isProcessing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {isSubmitting ? "Đang xử lý..." : "Đang tạo video..."}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Tạo Video
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
