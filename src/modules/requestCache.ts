import type { Method, RequestData, Params } from '../index'

import { IndexedDB } from 'yhl-utils'
import MD5 from 'blueimp-md5'

interface EndCacheData {
  DB?: IndexedDB | undefined
  cacheName?: string
  cacheData?: any
}

const CacheNameDBName = '_RequestCache'
IndexedDB.initConfig('RequestCache', {
  keyPath: 'cacheName',
  keys: {
    cacheName: { unique: true },
    params: { unique: false },
    data: { unique: false },
    time: { unique: false },
    url: { unique: false },
  },
})

// 获取缓存数据
export async function getCache(method: Method, url: string, endData: RequestData, params: Params): Promise<EndCacheData> {
  const endCacheData: EndCacheData = {}

  // 设置缓存名 除去 _rid
  const cacheNameJSON = JSON.stringify({
    method,
    url,
    data: typeof endData === 'object' && Object.keys(endData).length ? endData : undefined,
    params,
  })

  const userTag = await (async () => {
    if (params?.isLoginCache === false || !params.getLoginCacheUniqueFn) return ''
    return '-' + MD5(await params.getLoginCacheUniqueFn())
  })()

  const cacheName = '_RequestCache' + userTag + '-' + MD5(cacheNameJSON)
  endCacheData.cacheName = cacheName

  if (!params?.isCache) return endCacheData

  const { DB, sessionData } = await (async () => {
    let DB = undefined
    let sessionData = undefined

    if (params.openIndexedDB === true && IndexedDB.hasDB()) {
      DB = new IndexedDB(CacheNameDBName)
      sessionData = await DB.get(cacheName)
    } else {
      sessionData = window.sessionStorage.getItem(cacheName)
    }

    return { DB, sessionData }
  })()
  endCacheData.DB = DB

  if (!sessionData) return endCacheData

  const cacheData = (() => {
    if (DB) return sessionData

    try {
      return JSON.parse(sessionData)
    } catch (error) {}
  })()
  if (!cacheData) return endCacheData

  function clearSession() {
    setTimeout(() => {
      if (DB) {
        DB.delete(cacheName)
        return
      }

      window.sessionStorage.removeItem(cacheName)
    }, 0)
  }

  if (!cacheData || 'cacheNamedataparamstimeurl' !== Object.keys(cacheData).sort().join('') || cacheData.time < +new Date()) {
    clearSession()
    return endCacheData
  }

  endCacheData.cacheData = cacheData.data
  return endCacheData
}

// 设置缓存
export async function setCache(cacheName: string, DB: EndCacheData['DB'], params: Params, urlStart: string, endData: RequestData, resData: any) {
  const toCache = function () {
    const data = {
      url: urlStart,
      params: { ...endData },
      data: resData,
      time: +new Date(),
    }
    delete data.params._rid

    if (DB) {
      const DBdata = { ...data, cacheName }
      DB.add(DBdata)
    } else {
      window.sessionStorage.setItem(cacheName, JSON.stringify(data))
    }
  }

  if (params.isCacheFn) {
    const isCache = await params.isCacheFn(resData)
    if (isCache !== false) toCache()
  } else {
    toCache()
  }
}
