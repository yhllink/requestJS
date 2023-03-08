import type { requestCommonReturn, Params } from '../index'

import { Again } from 'yhl-utils'

interface loadingDataType {
  type: 'loading' | 'end'
  data: requestCommonReturn
  time: any
}
const LoadingMap = new Map()

// 防抖
export default async function getLoadingMap(
  cacheName?: string,
  params?: Params
): Promise<{
  loadingData?: loadingDataType['data']
  loadEndFn?: any
}> {
  if (!cacheName || params?.debounce !== true) return {}

  const loadEndFn = (res: any) => {
    const loadingData: loadingDataType | undefined = LoadingMap.get(cacheName)
    if (loadingData) {
      loadingData.type = 'end'
      loadingData.data = res

      loadingData.time = setTimeout(() => {
        LoadingMap.delete(cacheName)
      }, params?.debounceTime || 3000)
      LoadingMap.set(cacheName, loadingData)
    }
  }

  const loadingData: loadingDataType | undefined = LoadingMap.get(cacheName)
  if (!loadingData) {
    LoadingMap.set(cacheName, { type: 'loading', data: null, time: -1 })
    return { loadEndFn }
  }

  if (loadingData.type === 'end') {
    return { loadingData: loadingData.data }
  }

  if (loadingData.type === 'loading') {
    clearTimeout(loadingData.time)

    const $again = new Again(
      () => {
        return new Promise((resolve, reject) => {
          const loadingData: loadingDataType | undefined = LoadingMap.get(cacheName)

          if (loadingData?.type === 'end') {
            return resolve(loadingData)
          }

          reject()
        })
      },
      10,
      500
    )

    const res = await $again.start()
    if (res.code === 200 && res.data.type === 'end' && res.data.data) {
      return { loadingData: res.data.data }
    }
  }

  return {}
}
