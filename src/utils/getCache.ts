import type { AxiosRequestConfig, Method, Params } from '../index'

import { IndexedDB, isServer } from 'yhl-utils'
import MD5 from 'blueimp-md5'

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

export function clearCache(cacheDateStore: Params['_cacheDateStore'] = ['indexedDB', 'localStorage', 'sessionStorage']) {
  if (isServer) return

  for (let i = 0; i < cacheDateStore.length; i++) {
    if (cacheDateStore[i] === 'indexedDB' && IndexedDB.hasDB()) {
      new IndexedDB(CacheNameDBName).clear()
    }

    if (cacheDateStore[i] === 'sessionStorage') {
      for (const key in window.sessionStorage) {
        if (key.indexOf(CacheNameDBName) === 0) {
          window.sessionStorage.removeItem(key)
        }
      }
    }

    if (cacheDateStore[i] === 'localStorage') {
      for (const key in window.localStorage) {
        if (key.indexOf(CacheNameDBName) === 0) {
          window.localStorage.removeItem(key)
        }
      }
    }
  }
}

export async function clearUserCache(cacheDateStore: Params['_cacheDateStore'] = ['indexedDB', 'localStorage', 'sessionStorage']) {
  if (isServer) return

  const CacheNameDBNameUserStart = CacheNameDBName + '--'
  for (let i = 0; i < cacheDateStore.length; i++) {
    if (cacheDateStore[i] === 'indexedDB' && IndexedDB.hasDB()) {
      const DB = new IndexedDB(CacheNameDBName)
      const list = await DB.queryKey((key) => key.indexOf(CacheNameDBNameUserStart) === 0)
      if (Array.isArray(list)) {
        for (let i = 0; i < list.length; i++) {
          DB.delete(list[i])
        }
      }
    }

    if (cacheDateStore[i] === 'sessionStorage') {
      for (const key in window.sessionStorage) {
        if (key.indexOf(CacheNameDBNameUserStart) === 0) {
          window.sessionStorage.removeItem(key)
        }
      }
    }

    if (cacheDateStore[i] === 'localStorage') {
      for (const key in window.localStorage) {
        if (key.indexOf(CacheNameDBNameUserStart) === 0) {
          window.localStorage.removeItem(key)
        }
      }
    }
  }
}

interface EndCacheData {
  cacheName?: string
  cacheData?: any
  setCache?: (cacheData: any) => void
}
export default async function getCache(method: Method, url: string, data: any, params: Params) {
  const endCacheData: EndCacheData = {}
  if (isServer) return endCacheData

  const userTag = params.__getCacheUserTag?.()

  // 设置缓存名
  const cacheName = CacheNameDBName + '-' + (userTag ? MD5(userTag) : '') + '-' + MD5(JSON.stringify({ method, url, data, params }))
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
    const cacheData: { cacheName?: string; data: any; time: number } = {
      cacheName: undefined,
      data: JSON.parse(JSON.stringify(res)),
      time: +new Date(),
    }

    for (let i = 0; i < DateStore.length; i++) {
      if (DateStore[i] === 'indexedDB' && DB) {
        cacheData.cacheName = cacheName
        DB.add(cacheData)
        return
      }

      if (DateStore[i] === 'sessionStorage') {
        window.sessionStorage.setItem(cacheName, JSON.stringify(cacheData))
        return
      }

      if (DateStore[i] === 'localStorage') {
        window.localStorage.setItem(cacheName, JSON.stringify(cacheData))
        return
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

  if (!cacheData || 'cacheNamedatatime' !== Object.keys(cacheData).sort().join('') || cacheData.time + params._isCache < +new Date()) {
    setTimeout(() => {
      for (let i = 0; i < DateStore.length; i++) {
        if (DateStore[i] === 'indexedDB' && DB) {
          DB.delete(cacheName)
          return
        }

        if (DateStore[i] === 'sessionStorage') {
          window.sessionStorage.removeItem(cacheName)
          return
        }

        if (DateStore[i] === 'localStorage') {
          window.localStorage.removeItem(cacheName)
          return
        }
      }
    }, 0)

    return endCacheData
  }

  cacheData.data._isCache = true
  endCacheData.cacheData = cacheData.data

  return endCacheData
}
