// import { useState, useMemo, useCallback } from "react"
// import { Video, AlertCircle } from 'lucide-react'
// import FromCreateVideo from "../../components/createVideo/FromCreateVideo"
// import VideoHistoryPanel from "../../components/createVideo/VideoHistoryPanel"
// import CopyButton from "../../components/createVideo/CopyButton"
// import HeaderCreateVideo from "../../components/createVideo/HeaderCreateVideo"
// import { useCreateVideoFlow } from "../../hooks/useCreateVideoFlow"
// import { useGetVideoGenHistoryQuery } from "../../api/videoGenerations"

// export function CreateVideoAIPage() {
//   const [selectedVideo, setSelectedVideo] = useState(null)

//   const { data: history = [], isFetching: historyLoading, refetch } = useGetVideoGenHistoryQuery()

//   const { status, videoUrl, result, error, isSubmitting, submitCreateVideo } = useCreateVideoFlow({
//     onDone: () => refetch(),
//   })

//   const displayStatus = selectedVideo ? 'succeeded' : status
//   const displayVideoUrl = selectedVideo?.videoUrl ?? (status === 'succeeded' ? videoUrl : null)

//   const displayResult = selectedVideo
//     ? {
//         beginImageUrl: selectedVideo.beginImageUrl,
//         endImageUrl: selectedVideo.endImageUrl,
//         promptSent: selectedVideo.promptSent,
//         modelName: selectedVideo.modelName,
//         generationMode: selectedVideo.generationMode,
//         cost: selectedVideo.cost,
//       }
//     : result

//   const handleSelectHistory = (item) => setSelectedVideo(item)

//   const wrappedSubmit = useCallback(
//     async (params) => {
//       setSelectedVideo(null)
//       await submitCreateVideo(params)
//       setTimeout(() => refetch(), 2000)
//     },
//     [submitCreateVideo, refetch],
//   )

//   const createVideoHook = useMemo(
//     () => ({ status, videoUrl, result, error, isSubmitting, submitCreateVideo: wrappedSubmit }),
//     [status, videoUrl, result, error, isSubmitting, wrappedSubmit],
//   )

//   return (
//     <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
//       <HeaderCreateVideo activeTab="video" />

//       <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-slate-950 text-white">
//         {/* Left Column */}
//         <FromCreateVideo createVideoHook={createVideoHook} />

//         {/* Center Column */}
//         <section className="relative flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-slate-950 px-8 py-4">

//           {displayResult && (
//             <div className="mb-4 flex w-full max-w-5xl items-center justify-start gap-2">
//               <div className="flex items-center gap-2 text-white">
//                 <Video className="h-6 w-6" />
//                 <span className="text-lg font-bold">Video</span>
//               </div>

//               <div className="ml-4 flex items-center gap-2">
//                 <div className="group/frame relative">
//                   <button
//                     type="button"
//                     className="flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold text-white"
//                   >
//                     <div className="h-7 w-7 overflow-hidden rounded-md bg-slate-700">
//                       <img src={displayResult.beginImageUrl} alt="Start frame" className="h-full w-full object-cover" />
//                     </div>
//                     {displayResult.endImageUrl ? 'Start / End' : 'Start'}
//                   </button>

//                   <div className="absolute left-0 top-full z-50 mt-2 hidden gap-2 group-hover/frame:flex">
//                     <img src={displayResult.beginImageUrl} alt="Start" className="h-32 w-32 rounded-lg border border-slate-700 object-cover shadow-xl" />
//                     {displayResult.endImageUrl && (
//                       <img src={displayResult.endImageUrl} alt="End" className="h-32 w-32 rounded-lg border border-slate-700 object-cover shadow-xl" />
//                     )}
//                   </div>
//                 </div>

//                 <button type="button" className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
//                   {displayResult?.modelName ?? 'Kling'}
//                 </button>

//                 {displayResult?.generationMode && (
//                   <span className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
//                     {displayResult.generationMode === 'std' ? '720p'
//                       : displayResult.generationMode === 'pro' ? '1080p'
//                       : displayResult.generationMode === '4k' ? '4K'
//                       : displayResult.generationMode}
//                   </span>
//                 )}

//                 {displayResult?.cost > 0 && (
//                   <span className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-emerald-400">
//                     {Math.round(displayResult.cost).toLocaleString('vi-VN')} VND
//                   </span>
//                 )}

//                 <CopyButton text={displayResult.promptSent} />
//               </div>
//             </div>
//           )}

//           {displayResult?.promptSent && (
//             <div className="group relative mb-4 w-full max-w-5xl cursor-default">
//               <div className="max-h-[88px] overflow-hidden">
//                 <p className="text-sm leading-8 text-slate-100">{displayResult.promptSent}</p>
//               </div>
//               <div className="absolute left-0 top-full z-30 mt-4 hidden w-full rounded-xl bg-slate-800 p-4 text-sm leading-8 text-slate-100 shadow-2xl group-hover:block">
//                 <div className="absolute -top-2 left-1/2 h-4 w-4 rotate-45 bg-slate-800" />
//                 <p>{displayResult.promptSent}</p>
//               </div>
//             </div>
//           )}

//           <div className="group relative aspect-video w-full max-w-5xl flex-1 overflow-hidden rounded-2xl border border-white/5 bg-slate-900 shadow-2xl max-h-[calc(100vh-300px)]">

//             {!displayStatus && !selectedVideo && (
//               <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
//                 <div className="relative">
//                   <div className="absolute inset-0 scale-150 rounded-full bg-indigo-500/20 blur-3xl" />
//                   <Video className="relative z-10 h-16 w-16 text-indigo-400" />
//                 </div>
//                 <div className="space-y-2 text-center">
//                   <p className="text-xl font-bold text-white">Ready to Create</p>
//                   <p className="text-sm text-slate-400">Input your prompt to begin the generation process</p>
//                 </div>
//               </div>
//             )}

//             {!selectedVideo && (displayStatus === 'queued' || displayStatus === 'processing') && (
//               <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
//                 <div className="relative h-16 w-16">
//                   <div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />
//                   <div className="absolute inset-2 animate-pulse rounded-full bg-indigo-500/20" />
//                 </div>
//                 <div className="space-y-2 text-center">
//                   <p className="text-lg font-bold text-white">
//                     {displayStatus === 'queued' ? 'Đang chờ xử lý...' : 'Đang tạo video...'}
//                   </p>
//                   <p className="text-sm text-slate-400">Thường mất 3 - 5 phút</p>
//                 </div>
//               </div>
//             )}

//             {displayVideoUrl && (
//               <video
//                 key={displayVideoUrl}
//                 src={displayVideoUrl}
//                 controls autoPlay loop
//                 className="h-full w-full object-contain"
//               />
//             )}

//             {!selectedVideo && displayStatus === 'failed' && (
//               <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
//                 <AlertCircle className="h-16 w-16 text-red-400" />
//                 <div className="space-y-2 text-center">
//                   <p className="text-lg font-bold text-white">Tạo video thất bại</p>
//                   <p className="text-sm text-red-400">{error}</p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </section>

//         {/* Right Column - History */}
//         <VideoHistoryPanel
//           history={history}
//           loading={historyLoading}
//           selectedId={selectedVideo?.id}
//           onSelect={handleSelectHistory}
//         />
//       </div>
//     </div>
//   )
// }
import { useState, useMemo, useCallback } from "react"
import { Video, AlertCircle } from 'lucide-react'
import FromCreateVideo from "../../components/createVideo/FromCreateVideo"
import VideoHistoryPanel from "../../components/createVideo/VideoHistoryPanel"
import CopyButton from "../../components/createVideo/CopyButton"
import HeaderCreateVideo from "../../components/createVideo/HeaderCreateVideo"
import { useCreateVideoFlow } from "../../hooks/useCreateVideoFlow"
import { useGetVideoGenHistoryQuery } from "../../api/videoGenerations"

export function CreateVideoAIPage() {
  const [selectedVideo, setSelectedVideo] = useState(null)

  const { data: history = [], isFetching: historyLoading, refetch } = useGetVideoGenHistoryQuery()

  const { status, videoUrl, result, error, isSubmitting, submitCreateVideo } = useCreateVideoFlow({
    onDone: () => refetch(),
  })

  const displayStatus = selectedVideo ? 'succeeded' : status
  const displayVideoUrl = selectedVideo?.videoUrl ?? (status === 'succeeded' ? videoUrl : null)

  const displayResult = selectedVideo
    ? {
        beginImageUrl: selectedVideo.beginImageUrl,
        endImageUrl: selectedVideo.endImageUrl,
        promptSent: selectedVideo.promptSent,
        modelName: selectedVideo.modelName,
        generationMode: selectedVideo.generationMode,
        cost: selectedVideo.cost,
      }
    : result

  const handleSelectHistory = (item) => setSelectedVideo(item)

  const wrappedSubmit = useCallback(
    async (params) => {
      setSelectedVideo(null)
      await submitCreateVideo(params)
      setTimeout(() => refetch(), 2000)
    },
    [submitCreateVideo, refetch],
  )

  const createVideoHook = useMemo(
    () => ({ status, videoUrl, result, error, isSubmitting, submitCreateVideo: wrappedSubmit }),
    [status, videoUrl, result, error, isSubmitting, wrappedSubmit],
  )

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      <HeaderCreateVideo activeTab="video" />

      <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-gray-50 text-gray-900">
        {/* Left Column */}
        <FromCreateVideo createVideoHook={createVideoHook} />

        {/* Center Column */}
        <section className="relative flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-gray-50 px-8 py-4">

          {displayResult && (
            <div className="mb-4 flex w-full max-w-5xl items-center justify-start gap-2">
              <div className="flex items-center gap-2 text-gray-900">
                <Video className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-bold">Video</span>
              </div>

              <div className="ml-4 flex items-center gap-2">
                <div className="group/frame relative">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm"
                  >
                    <div className="h-7 w-7 overflow-hidden rounded-md bg-gray-100">
                      <img src={displayResult.beginImageUrl} alt="Start frame" className="h-full w-full object-cover" />
                    </div>
                    {displayResult.endImageUrl ? 'Start / End' : 'Start'}
                  </button>

                  <div className="absolute left-0 top-full z-50 mt-2 hidden gap-2 group-hover/frame:flex">
                    <img src={displayResult.beginImageUrl} alt="Start" className="h-32 w-32 rounded-lg border border-gray-200 object-cover shadow-xl" />
                    {displayResult.endImageUrl && (
                      <img src={displayResult.endImageUrl} alt="End" className="h-32 w-32 rounded-lg border border-gray-200 object-cover shadow-xl" />
                    )}
                  </div>
                </div>

                <button type="button" className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm">
                  {displayResult?.modelName ?? 'Kling'}
                </button>

                {displayResult?.generationMode && (
                  <span className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm">
                    {displayResult.generationMode === 'std' ? '720p'
                      : displayResult.generationMode === 'pro' ? '1080p'
                      : displayResult.generationMode === '4k' ? '4K'
                      : displayResult.generationMode}
                  </span>
                )}

                {displayResult?.cost > 0 && (
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
                    {Math.round(displayResult.cost).toLocaleString('vi-VN')} VND
                  </span>
                )}

                <CopyButton text={displayResult.promptSent} />
              </div>
            </div>
          )}

          {displayResult?.promptSent && (
            <div className="group relative mb-4 w-full max-w-5xl cursor-default">
              <div className="max-h-[88px] overflow-hidden">
                <p className="text-sm leading-8 text-gray-700">{displayResult.promptSent}</p>
              </div>
              <div className="absolute left-0 top-full z-30 mt-4 hidden w-full rounded-xl border border-gray-200 bg-white p-4 text-sm leading-8 text-gray-700 shadow-2xl group-hover:block">
                <div className="absolute -top-2 left-1/2 h-4 w-4 rotate-45 border-l border-t border-gray-200 bg-white" />
                <p>{displayResult.promptSent}</p>
              </div>
            </div>
          )}

          <div className="group relative aspect-video w-full max-w-5xl flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm max-h-[calc(100vh-300px)]">

            {!displayStatus && !selectedVideo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 scale-150 rounded-full bg-blue-100 blur-3xl" />
                  <Video className="relative z-10 h-16 w-16 text-blue-500" />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-xl font-bold text-gray-900">Ready to Create</p>
                  <p className="text-sm text-gray-500">Input your prompt to begin the generation process</p>
                </div>
              </div>
            )}

            {!selectedVideo && (displayStatus === 'queued' || displayStatus === 'processing') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
                  <div className="absolute inset-2 animate-pulse rounded-full bg-blue-100" />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {displayStatus === 'queued' ? 'Đang chờ xử lý...' : 'Đang tạo video...'}
                  </p>
                  <p className="text-sm text-gray-500">Thường mất 3 - 5 phút</p>
                </div>
              </div>
            )}

            {displayVideoUrl && (
              <video
                key={displayVideoUrl}
                src={displayVideoUrl}
                controls autoPlay loop
                className="h-full w-full object-contain bg-gray-900"
              />
            )}

            {!selectedVideo && displayStatus === 'failed' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <AlertCircle className="h-16 w-16 text-red-500" />
                <div className="space-y-2 text-center">
                  <p className="text-lg font-bold text-gray-900">Tạo video thất bại</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Column - History */}
        <VideoHistoryPanel
          history={history}
          loading={historyLoading}
          selectedId={selectedVideo?.id}
          onSelect={handleSelectHistory}
        />
      </div>
    </div>
  )
}