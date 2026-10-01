import { useState, useCallback, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import {
  useCreateVideoGenerationMutation,
  useGetVideoGenerationStatusQuery,
} from '../api/videoGenerations'

function buildVideoFormData(params) {
  const {
    projectId, opportunityId, taskId,
    modelId, resolution, ratio, duration, mode, prompt, negativePrompt,
    startImageFile, endImageFile, startImageAssetId, endImageAssetId,
    sound = 'off', cost = 0, multiShot = false, shotType, multiPrompt,
  } = params

  const formData = new FormData()
  if (projectId) formData.append('projectId', String(projectId))
  if (opportunityId) formData.append('opportunityId', String(opportunityId))
  if (taskId) formData.append('taskId', String(taskId))
  formData.append('modelId', String(modelId))
  formData.append('resolution', resolution)
  formData.append('duration', String(duration))
  formData.append('mode', mode)
  formData.append('prompt', prompt || '')
  formData.append('sound', sound)
  formData.append('cost', String(cost))

  if (ratio) formData.append('ratio', ratio)
  if (negativePrompt) formData.append('negativePrompt', negativePrompt)

  if (startImageAssetId) {
    formData.append('startImageAssetId', String(startImageAssetId))
  } else if (startImageFile) {
    formData.append('startImage', startImageFile)
  }

  if (endImageAssetId) {
    formData.append('endImageAssetId', String(endImageAssetId))
  } else if (endImageFile) {
    formData.append('endImage', endImageFile)
  }

  formData.append('multiShot', String(multiShot))
  if (multiShot && shotType) formData.append('shotType', shotType)
  if (multiShot && shotType === 'customize' && Array.isArray(multiPrompt)) {
    formData.append('multiPrompt', JSON.stringify(multiPrompt))
  }

  return formData
}

/**
 * Thay thế cho useCreateVideo cũ, giữ nguyên interface:
 * { status, videoUrl, result, error, isSubmitting, submitCreateVideo }
 * nhưng dùng RTK Query mutation + polling query thay vì axios + setInterval.
 */
export function useCreateVideoFlow({ onDone } = {}) {
  const [videoGenerationId, setVideoGenerationId] = useState(null)
  const [isDone, setIsDone] = useState(false)
  const [result, setResult] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  const [createVideoGeneration, { isLoading: isSubmitting }] = useCreateVideoGenerationMutation()

  const { data: statusData, error: statusQueryError } = useGetVideoGenerationStatusQuery(
    videoGenerationId,
    {
      skip: !videoGenerationId || isDone,
      pollingInterval: 5000,
    },
  )

  const status = statusData?.status ?? (videoGenerationId && !isDone ? 'queued' : null)
  const videoUrl = statusData?.videoUrl ?? null
  const error = statusData?.errorMessage || statusQueryError?.data?.message || submitError

  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  // useEffect(() => {
  //   if (status === 'succeeded' || status === 'failed') {
  //     setIsDone(true)
  //     onDoneRef.current?.(status)
  //   }
  // }, [status])
  useEffect(() => {
    if (status === 'succeeded') {
      setIsDone(true)
      toast.success('Tạo video thành công!')
      onDoneRef.current?.(status)
    } else if (status === 'provider_failed' || status === 'failed') {
      setIsDone(true)
      toast.error(error || 'Tạo video thất bại')
      onDoneRef.current?.(status)
     }
  }, [status])

  const submitCreateVideo = useCallback(
    async (params) => {
      setSubmitError(null)
      setResult(null)
      setVideoGenerationId(null)
      setIsDone(false)

      try {
        const formData = buildVideoFormData(params)
        const data = await createVideoGeneration(formData).unwrap()
        setResult(data)
        setVideoGenerationId(data.videoGenerationId)
      } catch (err) {
        // setSubmitError(err?.data?.message || err?.message || 'Tạo video thất bại')
        const msg = err?.data?.message || err?.message || 'Tạo video thất bại'
        setSubmitError(msg)
        toast.error(msg)
      }
    },
    [createVideoGeneration],
  )

  return { submitCreateVideo, isSubmitting, result, status, videoUrl, error }
}
