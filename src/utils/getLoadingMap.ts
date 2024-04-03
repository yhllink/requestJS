import type { Params } from '../index'

import { Again } from 'yhl-utils'

interface loadingDataType {
  type: 'loading' | 'end'
  data: any
  dataType?: 'success' | 'fail'
  time: any
}

const LoadingMap = new Map<string, loadingDataType>()

// 防抖
export default async function getLoadingMap(
  cacheName?: string,
  params?: Params
): Promise<{
  loadingDataType?: loadingDataType['dataType']
  loadingData?: any
  loadEndFn?: (type: loadingDataType['dataType'], res?: any) => void
}> {
  if (!cacheName || params?._debounce !== true) return {}

  const loadEndFn = (type: loadingDataType['dataType'], res: any) => {
    const loadingData = LoadingMap.get(cacheName)
    if (!loadingData) return

    loadingData.type = 'end'
    loadingData.data = res
    loadingData.dataType = type

    loadingData.time = setTimeout(() => {
      LoadingMap.delete(cacheName)
    }, params?._debounceTime || 500)

    LoadingMap.set(cacheName, loadingData)
  }

  const loadingData: loadingDataType | undefined = LoadingMap.get(cacheName)
  if (!loadingData) {
    LoadingMap.set(cacheName, { type: 'loading', data: null, time: -1 })
    return { loadEndFn }
  }

  if (loadingData.type === 'end') {
    return { loadingDataType: loadingData.dataType, loadingData: loadingData.data }
  }

  if (loadingData.type === 'loading') {
    clearTimeout(loadingData.time)

    const $again = new Again(
      () => {
        return new Promise((resolve, reject) => {
          const loadingData = LoadingMap.get(cacheName)

          if (loadingData?.type === 'end') {
            return resolve(loadingData)
          }

          reject()
        })
      },
      10,
      500
    )

    const {
      code,
      data: { type, dataType, data },
    } = await $again.start()

    if (code === 200 && type === 'end' && data) {
      return { loadingDataType: dataType, loadingData: data }
    }
  }

  return {}
}
