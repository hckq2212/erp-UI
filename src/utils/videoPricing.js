import { RESOLUTION_TO_MODE } from './videoOptions.js'

export const VIDEO_PRICING = {
  'kling-v3': {
    label: 'Kling v3',
    currency: 'VND',
    video: {
      std:  { noAudio: 2302, withAudio: 3452 },
      pro:  { noAudio: 3069, withAudio: 4603 },
      '4k': { noAudio: 11508, withAudio: 11508 },
    },
    motionControl: { std: 3452, pro: 4603 },
  },
  'kling-v2-6': {
    label: 'Kling v2.6',
    currency: 'VND',
    video: {
      std:  { noAudio: 1151 },
      pro:  { noAudio: 1918, withAudio: 3836 },
    },
    motionControl: { std: 1918, pro: 3069 },
  },
  'dreamina-seedance-2-0-260128': {
    label: 'Seedance 2.0',
    currency: 'VND',
    video: {},
    motionControl: null,
  },
}

export function calcVideoPrice({ modelCode, resolution, duration, nativeAudio }) {
  const pricing = VIDEO_PRICING[modelCode]
  if (!pricing) return null

  const mode      = RESOLUTION_TO_MODE[resolution?.toLowerCase()] ?? 'pro'
  const audioKey  = nativeAudio ? 'withAudio' : 'noAudio'
  const perSecond = pricing.video?.[mode]?.[audioKey]
  if (perSecond == null) return null

  return {
    perSecond,
    total: +(perSecond * duration).toFixed(4),
    mode,
    currency: pricing.currency ?? 'VND',
  }
}

export function calcMotionControlPrice({ modelCode, resolution, duration }) {
  const pricing = VIDEO_PRICING[modelCode]
  if (!pricing?.motionControl) return null

  const mode      = RESOLUTION_TO_MODE[resolution?.toLowerCase()] ?? 'pro'
  const perSecond = pricing.motionControl[mode]
  if (perSecond == null) return null

  return {
    perSecond,
    total: +(perSecond * duration).toFixed(4),
    mode,
    currency: pricing.currency ?? 'VND',
  }
}