import { useState, useCallback, useEffect, useRef } from 'react'
import {
  useCreateMotionControlVideoMutation,
  useGetVideoGenerationStatusQuery,
} from '../api/videoGenerations'

export function useCreateMotionControlFlow({ onDone } = {}) {
  const [videoGenerationId, setVideoGenerationId] = useState(null)
  const [isDone, setIsDone] = useState(false)
  const [result, setResult] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  const [createMotionControlVideo, { isLoading: isSubmitting }] = useCreateMotionControlVideoMutation()

  const { data: statusData, error: statusQueryError } = useGetVideoGenerationStatusQuery(
    videoGenerationId,
    { skip: !videoGenerationId || isDone, pollingInterval: 5000 },
  )

  const status = statusData?.status ?? (videoGenerationId && !isDone ? 'queued' : null)
  const videoUrl = statusData?.videoUrl ?? null
  const error = statusData?.errorMessage || statusQueryError?.data?.message || submitError

  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (status === 'succeeded' || status === 'failed') {
      setIsDone(true)
      onDoneRef.current?.(status)
    }
  }, [status])

  const submitCreateMotionControl = useCallback(
    async (params) => {
      const {
        projectId,
        modelId, modelName, prompt, characterOrientation, keepOriginalSound, mode,
        characterImageFile, referenceVideoFile,
        characterImageAssetId, referenceVideoAssetId,
        characterImagePreview, referenceVideoPreview,
        cost = 0,
      } = params

      setSubmitError(null)
      setResult(null)
      setVideoGenerationId(null)
      setIsDone(false)

      try {
        const formData = new FormData()
        formData.append('projectId', String(projectId))
        formData.append('modelId', String(modelId))
        formData.append('prompt', prompt || '')
        formData.append('characterOrientation', characterOrientation)
        formData.append('keepOriginalSound', keepOriginalSound)
        formData.append('mode', mode || 'pro')
        formData.append('cost', String(cost))

        if (characterImageAssetId) {
          formData.append('characterImageAssetId', String(characterImageAssetId))
        } else if (characterImageFile) {
          formData.append('characterImage', characterImageFile)
        }

        if (referenceVideoAssetId) {
          formData.append('referenceVideoAssetId', String(referenceVideoAssetId))
        } else if (referenceVideoFile) {
          formData.append('referenceVideo', referenceVideoFile)
        }

        const data = await createMotionControlVideo(formData).unwrap()

        setResult({
          ...data,
          beginImageUrl: data.characterImageUrl ?? characterImagePreview,
          referenceVideoUrl: data.referenceVideoUrl ?? referenceVideoPreview,
          promptSent: prompt || '',
          modelName: data.modelName ?? modelName ?? null,
          generationMode: mode === 'pro' ? 'pro' : 'std', // đồng bộ với badge UI, tránh bug cũ
          cost,
        })
        setVideoGenerationId(data.videoGenerationId)
      } catch (err) {
        setSubmitError(err?.data?.message || err?.message || 'Tạo video thất bại')
      }
    },
    [createMotionControlVideo],
  )

  return { submitCreateMotionControl, isSubmitting, result, status, videoUrl, error }
}