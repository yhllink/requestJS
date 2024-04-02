import type { AxiosRequestConfig, Method, Params } from '../index'

import { IndexedDB, isServer } from 'yhl-utils'
import MD5 from 'blueimp-md5'

const CacheNameBase = 'web-'

const CacheNameDBName = 'yhlRequestCache'
if (!isServer) {
  IndexedDB.initConfig(CacheNameDBName, {
    keyPath: 'cacheName',
    keys: {
      cacheName: { unique: true },
      params: { unique: false },
      data: { unique: false },
      time: { unique: false },
      url: { unique: false },
    },
  })
}

interface EndCacheData {
  cacheName?: string
  cacheData?: any
  setCache?: (cacheData: any) => void
}
export default async function getCache(method: Method, url: string, data: any, params: Params, axiosConfig: AxiosRequestConfig) {
  const endCacheData: EndCacheData = {}
  if (isServer) return endCacheData

  // 设置缓存名
  const cacheName = CacheNameBase + '-' + MD5(JSON.stringify({ axiosConfig, cacheNameJSON: { method, url, data, params } }))
  endCacheData.cacheName = cacheName

  if (!params?._isCache) return endCacheData

  const DateStore = params._cacheDateStore || ['indexedDB', 'sessionStorage']

  const { DB, sessionData } = await (async () => {
    let DB = undefined
    let sessionData = undefined

    for (let i = 0; i < DateStore.length; i++) {
      if (DateStore[i] === 'indexedDB' && IndexedDB.hasDB()) {
        DB = new IndexedDB(CacheNameDBName)
        sessionData = await DB.get(cacheName)
        break
      }

      if (DateStore[i] === 'sessionStorage') {
        sessionData = window.sessionStorage.getItem(cacheName)
        break
      }

      if (DateStore[i] === 'localStorage') {
        sessionData = window.localStorage.getItem(cacheName)
        break
      }
    }

    return { DB, sessionData }
  })()

  const toCache = function (res: any) {
    const cacheData = {
      url,
      params: { ...data },
      data: res,
      time: +new Date(),
    }

    for (let i = 0; i < DateStore.length; i++) {
      if (DateStore[i] === 'indexedDB' && DB) {
        // @ts-ignore
        cacheData.cacheName = cacheName
        DB.add(cacheData)
        break
      }

      if (DateStore[i] === 'sessionStorage') {
        window.sessionStorage.setItem(cacheName, JSON.stringify(cacheData))
        break
      }

      if (DateStore[i] === 'localStorage') {
        window.localStorage.setItem(cacheName, JSON.stringify(cacheData))
        break
      }
    }
  }

  endCacheData.setCache = function (res) {
    toCache(res)
  }

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

      sessionStorage.removeItem(cacheName)
    }, 0)
  }

  if (!cacheData || 'cacheNamedataparamstimeurl' !== Object.keys(cacheData).sort().join('') || cacheData.time + params._isCache < +new Date()) {
    clearSession()
    return endCacheData
  }

  endCacheData.cacheData = cacheData.data

  return endCacheData
}
