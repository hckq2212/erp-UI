import { useCreateElementMutation } from '../api/elements'

export function useCreateElement() {
  const [createElementMutation, { isLoading: isSubmitting, error }] = useCreateElementMutation()

  /**
   * @param {object} params
   * @param {string|number} params.providerId
   * @param {'image_refer'|'video_refer'} params.referenceType
   * @param {string} params.elementName
   * @param {string} params.elementDescription
   * @param {string} [params.elementVoiceId]
   * @param {number} [params.frontalImageAssetId]
   * @param {File}   [params.frontalImageFile]
   * @param {Array<{assetId?:number, file?:File}>} [params.referImages]
   * @param {number} [params.videoAssetId]
   * @param {File}   [params.videoFile]
   */
  const submitCreateElement = async (params) => {
    const formData = new FormData()
    formData.append('providerId', String(params.providerId))
    formData.append('referenceType', params.referenceType)
    formData.append('elementName', params.elementName)
    formData.append('elementDescription', params.elementDescription)

    if (params.referenceType === 'image_refer') {
      if (params.elementVoiceId) formData.append('elementVoiceId', params.elementVoiceId)

      if (params.frontalImageAssetId) {
        formData.append('frontalImageAssetId', String(params.frontalImageAssetId))
      } else if (params.frontalImageFile) {
        formData.append('frontalImage', params.frontalImageFile)
      }

      const referAssetIds = []
      params.referImages?.forEach((r) => {
        if (r.assetId) referAssetIds.push(r.assetId)
        else if (r.file) formData.append('referImages', r.file)
      })
      if (referAssetIds.length > 0) {
        formData.append('referImageAssetIds', JSON.stringify(referAssetIds))
      }
    } else {
      if (params.videoAssetId) {
        formData.append('videoAssetId', String(params.videoAssetId))
      } else if (params.videoFile) {
        formData.append('video', params.videoFile)
      }
    }

    // invalidatesTags trên mutation sẽ tự refetch danh sách Element ngay sau khi tạo,
    // Library page sẽ tự poll tiếp cho tới khi item chuyển 'succeeded'.
    return createElementMutation(formData).unwrap()
  }

  return { submitCreateElement, isSubmitting, error }
}