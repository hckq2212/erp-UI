import { useRef, useState, useCallback, useEffect, useMemo } from "react"
import CustomSettingVideo from "./CustomSettingVideo"
import MultiShotPanel from "./MultiShotPanel"
import AssetPickerModal from "./AssetPickerModal"
import { useGetAiModelsQuery } from '../../api/aiModels'
import { calcVideoPrice } from '../../utils/videoPricing'
import { RESOLUTION_TO_MODE } from '../../utils/videoOptions'
import { ChevronDown, ChevronRight, ImagePlus, History, Trash2, Zap, RotateCcw } from 'lucide-react'
import { useGetTasksQuery } from '../../api/tasks'

const STATUS_LABEL = {
  queued: 'Đang chờ xử lý...',
  processing: 'Đang tạo video...',
  succeeded: 'Tạo video thành công!',
  failed: 'Tạo video thất bại',
}

const STATUS_COLOR = {
  queued: 'text-yellow-600',
  processing: 'text-blue-600',
  succeeded: 'text-emerald-600',
  failed: 'text-red-600',
}

const RESOLUTION_MODE_MAP = {
  '720p': 'std',
  '1080p': 'pro',
  '4k': '4k',
}

function buildDefaultShots(totalDuration) {
  const half = Math.floor(totalDuration / 2)
  const rest = totalDuration - half
  return [
    { id: 1, prompt: '', duration: half },
    { id: 2, prompt: '', duration: rest },
  ]
}

export default function FromCreateVideo({ createVideoHook }) {
  const textareaRef = useRef(null)

  const [startFrame, setStartFrame] = useState(null)
  const [endFrame, setEndFrame] = useState(null)
  const [startFile, setStartFile] = useState(null)
  const [endFile, setEndFile] = useState(null)

  // ── Reuse ảnh có sẵn trong thư viện (không upload lại lên Cloudinary) ──
  const [startAssetId, setStartAssetId] = useState(null)
  const [endAssetId, setEndAssetId] = useState(null)
  const [pickerTarget, setPickerTarget] = useState(null) // 'start' | 'end' | null

  const { data: models = [], isLoading: modelsLoading } = useGetAiModelsQuery({ modelType: 'video_generation' })
  const [selectedModel, setSelectedModel] = useState('')

  const [sourceType, setSourceType] = useState('project')
  const [contextId, setContextId] = useState('')
  const [taskId, setTaskId] = useState('')
  const { data: tasksData, isFetching: tasksLoading } = useGetTasksQuery(
    { excludeStatus: 'PENDING,ACCEPTED,AWAITING_REVIEW,INTERNAL_COMPLETED,COMPLETED,CANCELLED', limit: 100 },
  )
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
  const hasNoContext = !tasksLoading && contexts.length === 0
  const hasNoTask = !!contextId && !tasksLoading && contextTasks.length === 0
  const selectedTask = contextTasks.find(task => String(task.id) === String(taskId))

  // ── derived: model code + provider ──────────────────────────────────────
  const selectedModelData = models.find((m) => String(m.id) === selectedModel)
  const selectedModelCode = selectedModelData?.code ?? ''
  const isByteplus = selectedModelData?.provider?.code === 'byteplus'

  const prevModelRef = useRef(null)
  useEffect(() => {
    if (prevModelRef.current !== null && prevModelRef.current !== selectedModel) {
      setResolution('1080p')
      setRatio('adaptive')
      setLength(5)
      // setNativeAudio(false)
      setNativeAudio(isByteplus)
      // BytePlus chưa hỗ trợ multi-shot → auto tắt khi đổi sang model BytePlus
      if (isByteplus) {
        setMultiShotEnabled(false)
        setIsCustomMode(false)
      }
    }
    prevModelRef.current = selectedModel
  }, [selectedModel]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (models.length > 0) {
      const defaultModel =
        models.find((m) => m.code === 'kling-v3') ?? models[models.length - 1]
      setSelectedModel(String(defaultModel.id))
    }
  }, [models])

  // ── settings ──
  const [resolution, setResolution] = useState('1080p')
  const [ratio, setRatio] = useState('adaptive')   // ← NEW, chỉ dùng khi isByteplus
  const [length, setLength] = useState(5)
  const [nativeAudio, setNativeAudio] = useState(false)

  const priceInfo = useMemo(
    () => calcVideoPrice({ modelCode: selectedModelCode, resolution, duration: length, nativeAudio }),
    [selectedModelCode, resolution, length, nativeAudio],
  )

  const priceColour =
    !priceInfo ? 'text-gray-400' :
      priceInfo.total < 50000 ? 'text-emerald-600' :
        priceInfo.total < 75000 ? 'text-yellow-600' :
          priceInfo.total < 100000 ? 'text-orange-600' :
            'text-red-600'

  const [prompt, setPrompt] = useState('')

  const [multiShotEnabled, setMultiShotEnabled] = useState(false)
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [shots, setShots] = useState(() => buildDefaultShots(5))

  useEffect(() => {
    if (!isCustomMode) {
      setShots(buildDefaultShots(length))
    }
  }, [length]) // eslint-disable-line react-hooks/exhaustive-deps

  const { submitCreateVideo, isSubmitting, status, error } = createVideoHook

  const totalShotDuration = shots.reduce((sum, s) => sum + s.duration, 0)
  const isShotOverLimit = isCustomMode && totalShotDuration > length
  const isShotUnderLimit = isCustomMode && totalShotDuration < length

  const handleImageUpload = useCallback(
    (event, type) => {
      const file = event.target.files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) {
        alert('Chỉ được upload file ảnh')
        event.target.value = ''
        return
      }
      const imageUrl = URL.createObjectURL(file)
      if (type === 'start') {
        if (startFrame) URL.revokeObjectURL(startFrame)
        if (endFrame) URL.revokeObjectURL(endFrame)
        setStartFrame(imageUrl)
        setStartFile(file)
        setStartAssetId(null)
        setEndFrame(null)
        setEndFile(null)
        setEndAssetId(null)
      } else {
        if (endFrame) URL.revokeObjectURL(endFrame)
        setEndFrame(imageUrl)
        setEndFile(file)
        setEndAssetId(null)
      }
      event.target.value = ''
    },
    [startFrame, endFrame],
  )

  const handleRemoveFrame = useCallback(
    (event, type) => {
      event.preventDefault()
      event.stopPropagation()
      if (type === 'start') {
        if (startFrame) URL.revokeObjectURL(startFrame)
        if (endFrame) URL.revokeObjectURL(endFrame)
        setStartFrame(null)
        setStartFile(null)
        setStartAssetId(null)
        setEndFrame(null)
        setEndFile(null)
        setEndAssetId(null)
      } else {
        if (endFrame) URL.revokeObjectURL(endFrame)
        setEndFrame(null)
        setEndFile(null)
        setEndAssetId(null)
      }
    },
    [startFrame, endFrame],
  )

  const handleSelectFromLibrary = useCallback(
    (asset) => {
      if (pickerTarget === 'start') {
        if (startFrame) URL.revokeObjectURL(startFrame)
        if (endFrame) URL.revokeObjectURL(endFrame)
        setStartFrame(asset.storedUrl)
        setStartFile(null)
        setStartAssetId(asset.id)
        setEndFrame(null)
        setEndFile(null)
        setEndAssetId(null)
      } else if (pickerTarget === 'end') {
        if (endFrame) URL.revokeObjectURL(endFrame)
        setEndFrame(asset.storedUrl)
        setEndFile(null)
        setEndAssetId(asset.id)
      }
      setPickerTarget(null)
    },
    [pickerTarget, startFrame, endFrame],
  )

  const handlePromptInput = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  const resetForm = useCallback(() => {
    if (startFrame) URL.revokeObjectURL(startFrame)
    if (endFrame) URL.revokeObjectURL(endFrame)
    setContextId('')
    setTaskId('')
    setStartFrame(null)
    setEndFrame(null)
    setStartFile(null)
    setEndFile(null)
    setStartAssetId(null)
    setEndAssetId(null)
    setPrompt('')
    setResolution('1080p')
    setRatio('adaptive')
    setLength(5)
    // setNativeAudio(false)
    setNativeAudio(isByteplus)
    setMultiShotEnabled(false)
    setIsCustomMode(false)
    setShots(buildDefaultShots(5))
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    // if (models.length > 0) {
    //   const def = models.find((m) => m.code === 'kling-v3') ?? models[models.length - 1]
    //   setSelectedModel(String(def.id))
    // }
    // }, [startFrame, endFrame, models])
  }, [startFrame, endFrame, isByteplus])

  const hasAutoResetRef = useRef(false)
  const resetFormRef = useRef(null)
  useEffect(() => { resetFormRef.current = resetForm }, [resetForm])
  useEffect(() => {
    if (status === 'succeeded' && !hasAutoResetRef.current) {
      hasAutoResetRef.current = true
      const t = setTimeout(() => resetFormRef.current?.(), 1500)
      return () => clearTimeout(t)
    }
    if (status === null) {
      hasAutoResetRef.current = false
    }
  }, [status])

  const handleToggleMultiShot = () => {
    if (isByteplus) return // Seedance chưa hỗ trợ multi-shot
    const next = !multiShotEnabled
    setMultiShotEnabled(next)
    if (!next) setIsCustomMode(false)
  }

  const handleToggleCustomMode = () => {
    if (isByteplus) return
    if (!isCustomMode) setShots(buildDefaultShots(length))
    setIsCustomMode((prev) => !prev)
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!contextId) { alert('Vui lòng chọn cơ hội hoặc dự án'); return }
    if (!taskId) { alert('Vui lòng chọn công việc'); return }
    if (!startFile && !startAssetId) {
      alert('Vui lòng chọn Start Frame')
      return
    }
    if (!selectedModel) {
      alert('Vui lòng chọn model')
      return
    }

    const mode = RESOLUTION_MODE_MAP[resolution.toLowerCase()] ?? 'pro'

    // ── Case 0: BytePlus/Seedance — luôn Normal mode, kèm ratio ─────────
    if (isByteplus) {
      if (!prompt.trim()) {
        alert('Vui lòng nhập prompt')
        return
      }

      await submitCreateVideo({
        projectId,
        opportunityId,
        taskId,
        modelId: selectedModel,
        resolution: resolution.toLowerCase(),
        ratio,
        duration: String(length),
        mode,
        sound: nativeAudio ? 'on' : 'off',
        prompt: prompt.trim(),
        multiShot: false,
        startImageFile: startFile,
        endImageFile: endFile,
        startImageAssetId: startAssetId,
        endImageAssetId: endAssetId,
        cost: Math.round(priceInfo?.total ?? 0),
      })
      return
    }

    // ── Case 1: Multi-Shot + Customize (Kling) ──────────────────────────
    if (multiShotEnabled && isCustomMode) {
      if (shots.some((s) => !s.prompt.trim())) {
        alert('Vui lòng điền nội dung cho tất cả các shot')
        return
      }
      if (isShotOverLimit) {
        alert(`Tổng thời gian shot (${totalShotDuration}s) vượt quá thời lượng video (${length}s)`)
        return
      }
      if (isShotUnderLimit) {
        alert(`Tổng thời gian shot (${totalShotDuration}s) chưa đủ ${length}s. Vui lòng điều chỉnh duration.`)
        return
      }

      const multiPrompt = shots.map((s, i) => ({
        index: i + 1,
        prompt: s.prompt.trim(),
        duration: String(s.duration),
      }))

      await submitCreateVideo({
        projectId,
        opportunityId,
        taskId,
        modelId: selectedModel,
        resolution: resolution.toLowerCase(),
        duration: String(length),
        mode,
        sound: nativeAudio ? 'on' : 'off',
        prompt: '',
        multiShot: true,
        shotType: 'customize',
        multiPrompt,
        startImageFile: startFile,
        endImageFile: endFile,
        startImageAssetId: startAssetId,
        endImageAssetId: endAssetId,
        cost: Math.round(priceInfo?.total ?? 0),
      })
      return
    }

    // ── Case 2: Multi-Shot + Intelligence (Kling) ───────────────────────
    if (multiShotEnabled && !isCustomMode) {
      if (!prompt.trim()) {
        alert('Vui lòng nhập prompt để Kling tự phân cảnh')
        return
      }

      await submitCreateVideo({
        projectId,
        opportunityId,
        taskId,
        modelId: selectedModel,
        resolution: resolution.toLowerCase(),
        duration: String(length),
        mode,
        sound: nativeAudio ? 'on' : 'off',
        prompt: prompt.trim(),
        multiShot: true,
        shotType: 'intelligence',
        startImageFile: startFile,
        endImageFile: endFile,
        startImageAssetId: startAssetId,
        endImageAssetId: endAssetId,
        cost: Math.round(priceInfo?.total ?? 0),
      })
      return
    }

    // ── Case 3: Normal (Kling, không multi-shot) ────────────────────────
    if (!prompt.trim()) {
      alert('Vui lòng nhập prompt')
      return
    }

    await submitCreateVideo({
      projectId,
      opportunityId,
      taskId,
      modelId: selectedModel,
      resolution: resolution.toLowerCase(),
      duration: String(length),
      mode,
      sound: nativeAudio ? 'on' : 'off',
      prompt: prompt.trim(),
      multiShot: false,
      startImageFile: startFile,
      endImageFile: endFile,
      startImageAssetId: startAssetId,
      endImageAssetId: endAssetId,
      cost: Math.round(priceInfo?.total ?? 0),
    })
  }

  const isProcessing = isSubmitting || status === 'queued' || status === 'processing'

  const isSubmitDisabled = (() => {
    if (isProcessing) return true
    if (!contextId || hasNoContext) return true
    if (!taskId) return true
    if (!startFile && !startAssetId) return true
    if (isShotOverLimit || isShotUnderLimit) return true

    if (multiShotEnabled && isCustomMode) {
      return shots.every((s) => !s.prompt.trim())
    }
    return !prompt.trim()
  })()

  return (
    // <section className="flex h-full w-[460px] flex-col overflow-hidden border-r border-gray-200 bg-white p-6">
    <section className="flex h-full w-[420px] shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white p-6">
      <div className="flex h-full min-h-0 flex-col">
        <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-5">
          <div className="grid shrink-0 grid-cols-2 gap-2">
            <button type="button" onClick={() => { setSourceType('project'); setContextId(''); setTaskId('') }} className={`rounded-lg border px-3 py-2 text-sm font-medium ${sourceType === 'project' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>Dự án</button>
            <button type="button" onClick={() => { setSourceType('opportunity'); setContextId(''); setTaskId('') }} className={`rounded-lg border px-3 py-2 text-sm font-medium ${sourceType === 'opportunity' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>Cơ hội</button>
          </div>
          <div className="shrink-0">
            {hasNoContext ? (
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
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={modelsLoading}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {modelsLoading ? (
                  <option>Đang tải...</option>
                ) : (
                  models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* ── Frame upload ── */}
          <div className="grid shrink-0 grid-cols-2 items-start gap-3">
            <label
              className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:border-blue-400 ${startFrame ? 'aspect-square' : 'h-[150px]'
                }`}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'start')}
              />
              {startFrame ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <img src={startFrame} alt="Start Frame" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="absolute right-2 top-2 z-10 flex gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setPickerTarget('start')
                      }}
                      title="Chọn từ thư viện"
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white transition-all hover:bg-black/80"
                    >
                      <History className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveFrame(e, 'start')}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white transition-all hover:bg-black/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
                    Start Frame
                  </span>
                </>
              ) : (
                <>
                  <ImagePlus className="h-6 w-6 text-gray-400 transition-colors group-hover:text-blue-500" />
                  <span className="mt-1 text-[10px] text-gray-400">Start Frame</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setPickerTarget('start')
                    }}
                    className="relative z-10 mt-2 rounded-md border border-gray-300 px-2.5 py-1 text-[10px] font-medium text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
                  >
                    History
                  </button>
                </>
              )}
            </label>

            <label
              className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:border-blue-400 ${startFrame ? 'aspect-square' : 'h-[150px]'
                } ${!startFrame ? 'pointer-events-none opacity-40' : ''}`}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={!startFrame}
                onChange={(e) => handleImageUpload(e, 'end')}
              />
              {endFrame ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <img src={endFrame} alt="End Frame" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="absolute right-2 top-2 z-10 flex gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setPickerTarget('end')
                      }}
                      title="Chọn từ thư viện"
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white transition-all hover:bg-black/80"
                    >
                      <History className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveFrame(e, 'end')}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white transition-all hover:bg-black/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
                    End Frame
                  </span>
                </>
              ) : (
                <>
                  <ImagePlus className="h-6 w-6 text-gray-400 transition-colors group-hover:text-blue-500" />
                  <span className="mt-1 text-[10px] text-gray-400">
                    {startFrame ? 'End Frame' : 'Upload Start First'}
                  </span>
                  {startFrame && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setPickerTarget('end')
                      }}
                      className="relative z-10 mt-2 rounded-md border border-gray-300 px-2.5 py-1 text-[10px] font-medium text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
                    >
                      History
                    </button>
                  )}
                </>
              )}
            </label>
          </div>

          <AssetPickerModal
            open={!!pickerTarget}
            onClose={() => setPickerTarget(null)}
            onSelect={handleSelectFromLibrary}
          />

          {/* ── Prompt / MultiShotPanel ── */}
          {multiShotEnabled && isCustomMode && !isByteplus ? (
            <div className="shrink-0">
              <MultiShotPanel
                shots={shots}
                onShotsChange={setShots}
                totalDuration={length}
              />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onInput={handlePromptInput}
              rows={1}
              className="min-h-[240px] w-full shrink-0 resize-none overflow-hidden rounded-xl border border-gray-300 bg-gray-50 p-4 font-mono text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              placeholder={'Bạn nhập prompt để tạo video...'}
            />
          )}

          {/* ── Status ── */}
          {status && (
            <div className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2">
                {(status === 'queued' || status === 'processing') && (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                )}
                <span className={`text-sm font-medium ${STATUS_COLOR[status]}`}>
                  {STATUS_LABEL[status]}
                </span>
              </div>
              {status === 'failed' && error && (
                <p className="mt-2 text-xs text-red-600">{error}</p>
              )}
            </div>
          )}

          {error && !status && (
            <p className="shrink-0 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* ── Bottom actions ── */}
        <div className="shrink-0 space-y-3 border-t border-gray-200 pt-4">

          <div className="flex items-center justify-between gap-2">
            <CustomSettingVideo
              modelCode={selectedModelCode}
              isByteplus={isByteplus}
              resolution={resolution}
              setResolution={setResolution}
              ratio={ratio}
              setRatio={setRatio}
              length={length}
              setLength={setLength}
              nativeAudio={nativeAudio}
              setNativeAudio={setNativeAudio}
            />

            <button
              type="button"
              onClick={resetForm}
              disabled={isProcessing}
              title="Reset form"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-gray-50 text-gray-400 transition-all hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <RotateCcw className="h-[18px] w-[18px]" />
            </button>

            {/* Multi-Shot toggle — ẩn hoàn toàn khi model là BytePlus */}
            {!isByteplus && (
              <div className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={handleToggleMultiShot}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-all ${multiShotEnabled
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  <span
                    className={`relative inline-flex h-3.5 w-6 shrink-0 rounded-full transition-colors ${multiShotEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow transition-all ${multiShotEnabled ? 'left-3' : 'left-0.5'
                        }`}
                    />
                  </span>
                  Multi-Shot
                </button>

                <span className="h-4 w-px bg-gray-200" />

                <button
                  type="button"
                  onClick={handleToggleCustomMode}
                  disabled={!multiShotEnabled}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-all ${!multiShotEnabled
                    ? 'cursor-not-allowed text-gray-300'
                    : isCustomMode
                      ? 'text-blue-600 hover:text-blue-700'
                      : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  Custom
                  <span className={`ml-1 inline-flex ${!multiShotEnabled ? 'text-gray-300' : ''}`}>
                    {isCustomMode ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-[minmax(0,4fr)_minmax(0,6fr)] items-center gap-3">

            <div className="flex h-[52px] min-w-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3">
              {priceInfo ? (
                <span className={`whitespace-nowrap font-mono text-xl font-black leading-none tracking-tight ${priceColour}`}>
                  {Math.round(priceInfo.total).toLocaleString('vi-VN')} VNĐ
                </span>
              ) : (
                <span className="text-[11px] text-gray-400">
                  {selectedModelCode ? 'No pricing data' : 'Chọn model để xem giá'}
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={isSubmitDisabled}
              onClick={handleSubmit}
              className="flex h-[52px] w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Zap className="h-[18px] w-[18px]" />
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
