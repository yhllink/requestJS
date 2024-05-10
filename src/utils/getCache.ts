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

export function clearCache() {
  if (isServer) return

  if (!IndexedDB.hasDB()) return

  new IndexedDB(CacheNameDBName).clear()
}

export async function clearUserCache() {
  if (isServer) return
  if (!IndexedDB.hasDB()) return

  const DB = new IndexedDB(CacheNameDBName)
  const list = await DB.queryKey((key) => key.split('-').length !== 2)
  if (Array.isArray(list)) {
    for (let i = 0; i < list.length; i++) {
      DB.delete(list[i])
    }
  }
}

interface EndCacheData {
  cacheName?: string
  cacheData?: any
  setCache?: (cacheData: any) => void
}
export default async function getCache(method: Method, url: string, data: any, params: Params, axiosConfig: AxiosRequestConfig) {
  const endCacheData: EndCacheData = {}
  if (isServer) return endCacheData

  const userTag = params.__getCacheUserTag?.()

  // 设置缓存名
  const cacheName = CacheNameBase + '-' + (userTag ? MD5(userTag) + '-' : '') + MD5(JSON.stringify({ cacheNameJSON: { method, url, data, params } }))
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

  endCacheData.setCache = function (res) {
    const cacheData: {
      cacheName?: string
      url: string
      params: any
      data: any
      time: number
    } = {
      cacheName: undefined,
      url,
      params: data,
      data: JSON.parse(JSON.stringify(res)),
      time: +new Date(),
    }

    for (let i = 0; i < DateStore.length; i++) {
      if (DateStore[i] === 'indexedDB' && DB) {
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

  if (!sessionData) return endCacheData

  const cacheData = (() => {
    if (DB) return sessionData

    try {
      return JSON.parse(sessionData)
    } catch (error) {}
  })()
  if (!cacheData) return endCacheData

  if (!cacheData || 'cacheNamedataparamstimeurl' !== Object.keys(cacheData).sort().join('') || cacheData.time + params._isCache < +new Date()) {
    setTimeout(() => {
      if (DB) {
        DB.delete(cacheName)
        return
      }

      sessionStorage.removeItem(cacheName)
    }, 0)

    return endCacheData
  }

  cacheData.data._isCache = true
  endCacheData.cacheData = cacheData.data

  return endCacheData
}
