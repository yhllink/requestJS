import type { Method, Params } from '../index'

// 导入工具库和MD5加密库
import MD5 from 'blueimp-md5'
import { deepClone, IndexedDB, isServer } from 'yhl-utils'

// 定义缓存数据库和存储名称
const CacheNameDBName = 'yhlRequestCache'

// 初始化缓存数据库配置，仅在非服务器环境下执行
if (!isServer) {
  IndexedDB.initConfig(CacheNameDBName, {
    keyPath: 'cacheName',
    keys: {
      cacheName: { unique: true }, // 唯一标识符
      data: { unique: false }, // 数据，非唯一
      time: { unique: false }, // 时间戳，非唯一
    },
  })
}

/**
 * 清除所有缓存，根据指定的存储类型进行清除
 * @param cacheDateStore 缓存存储类型，默认包括indexedDB、localStorage和sessionStorage
 */
export function clearCache(cacheDateStore: Params['_cacheDateStore'] = ['indexedDB', 'localStorage', 'sessionStorage']) {
  if (isServer) return

  for (let i = 0; i < cacheDateStore.length; i++) {
    if (cacheDateStore[i] === 'indexedDB' && IndexedDB.hasDB()) {
      // 清除indexedDB中的缓存
      try {
        new IndexedDB(CacheNameDBName).clear()
      } catch (error) {}
    }

    if (cacheDateStore[i] === 'sessionStorage') {
      for (const key in window.sessionStorage) {
        // 如果键以缓存数据库名称开始，则移除
        if (key.indexOf(CacheNameDBName) === 0) {
          window.sessionStorage.removeItem(key)
        }
      }
    }

    if (cacheDateStore[i] === 'localStorage') {
      for (const key in window.localStorage) {
        // 如果键以缓存数据库名称开始，则移除
        if (key.indexOf(CacheNameDBName) === 0) {
          window.localStorage.removeItem(key)
        }
      }
    }

    if (cacheDateStore[i] === 'window') {
      // @ts-ignore
      window[CacheNameDBName] = null // 如果键以缓存数据库名称开始，则移除
    }
  }
}

/**
 * 清除用户相关的缓存，根据指定的存储类型进行清除
 * @param cacheDateStore 缓存存储类型，默认包括indexedDB、localStorage和sessionStorage
 */
export async function clearUserCache(cacheDateStore: Params['_cacheDateStore'] = ['indexedDB', 'localStorage', 'sessionStorage']) {
  if (isServer) return

  const CacheNameDBNameUserStart = CacheNameDBName + '--' // 用户缓存的前缀
  for (let i = 0; i < cacheDateStore.length; i++) {
    if (cacheDateStore[i] === 'indexedDB' && IndexedDB.hasDB()) {
      try {
        const DB = new IndexedDB(CacheNameDBName)
        // 查询用户相关键
        const list = await DB.queryKey((key) => key.startsWith(CacheNameDBNameUserStart))
        if (Array.isArray(list)) {
          for (let i = 0; i < list.length; i++) {
            DB.delete(list[i]) // 删除用户相关键
          }
        }
      } catch (error) {}
    }

    if (cacheDateStore[i] === 'sessionStorage') {
      for (const key in window.sessionStorage) {
        // 如果键以用户缓存前缀开始，则移除
        if (key.indexOf(CacheNameDBNameUserStart) === 0) {
          window.sessionStorage.removeItem(key)
        }
      }
    }

    if (cacheDateStore[i] === 'localStorage') {
      for (const key in window.localStorage) {
        // 如果键以用户缓存前缀开始，则移除
        if (key.indexOf(CacheNameDBNameUserStart) === 0) {
          window.localStorage.removeItem(key)
        }
      }
    }

    // @ts-ignore
    if (cacheDateStore[i] === 'window' && window[CacheNameDBName] && typeof window[CacheNameDBName] === 'object') {
      // @ts-ignore
      for (const key in window[CacheNameDBName]) {
        // 如果键以用户缓存前缀开始，则移除
        if (key.indexOf(CacheNameDBNameUserStart) === 0) {
          // @ts-ignore
          window[CacheNameDBName].removeItem(key)
        }
      }
    }
  }
}

// 定义缓存数据接口
interface EndCacheData {
  cacheName?: string // 缓存名称
  cacheData?: any // 缓存数据
  setCache?: (cacheData: any) => void // 设置缓存的方法
}

/**
 * 获取缓存数据 设置新缓存
 * @param method 请求方法
 * @param url 请求URL
 * @param data 请求数据
 * @param params 请求参数
 * @returns 返回缓存数据或空对象
 */
export default async function getCache(method: Method, url: string, data: any, params: Params) {
  const endCacheData: EndCacheData = {} // 创建缓存数据对象

  const userTag = params.__getCacheUserTag?.() // 获取用户标签

  // 设置缓存名
  const cacheName = CacheNameDBName + '-' + (userTag ? MD5(userTag) : '') + '-' + MD5(JSON.stringify({ method, url, data, params })) // 生成缓存名
  endCacheData.cacheName = cacheName // 将缓存名赋值给缓存数据对象

  if (isServer) return endCacheData // 如果在服务器环境中直接返回
  if (!params?._isCache) return endCacheData // 如果请求参数中没有启用缓存则直接返回

  const DateStore = params._cacheDateStore || ['indexedDB', 'sessionStorage'] // 获取缓存存储位置列表

  const { DB, sessionData } = await (async () => {
    let DB = undefined
    let sessionData = undefined

    for (let i = 0; i < DateStore.length; i++) {
      if (DateStore[i] === 'indexedDB' && IndexedDB.hasDB()) {
        try {
          DB = new IndexedDB(CacheNameDBName)
          sessionData = await DB.get(cacheName) // 从indexedDB获取缓存数据
          break
        } catch (error) {}
      }

      if (DateStore[i] === 'sessionStorage') {
        sessionData = window.sessionStorage.getItem(cacheName) // 从sessionStorage获取缓存数据
        break
      }

      if (DateStore[i] === 'localStorage') {
        sessionData = window.localStorage.getItem(cacheName) // 从localStorage获取缓存数据
        break
      }

      if (DateStore[i] === 'window') {
        // @ts-ignore
        sessionData = window[CacheNameDBName]?.[cacheName] // 从window获取缓存数据
        break
      }
    }

    return { DB, sessionData }
  })()

  endCacheData.setCache = function (res) {
    // 定义设置缓存的方法
    const cacheData: { cacheName?: string; data: any; time: number } = {
      cacheName: undefined, // 缓存名称
      // 要缓存的数据
      data: JSON.parse(
        JSON.stringify({
          config: {
            ...res.config,
            transformResponse: undefined,
            transformRequest: undefined,
            transitional: undefined,
          },
          headers: res.headers,
          status: res.status,
          statusText: res.statusText,
        })
      ),
      time: +new Date(), // 当前时间戳
    }
    cacheData.data.data = deepClone(res.data)

    for (let i = 0; i < DateStore.length; i++) {
      if (DateStore[i] === 'indexedDB' && DB) {
        try {
          cacheData.cacheName = cacheName // 设置缓存名称
          DB.add(cacheData) // 添加到indexedDB
          return
        } catch (error) {}
      }

      if (DateStore[i] === 'sessionStorage') {
        window.sessionStorage.setItem(cacheName, JSON.stringify(cacheData)) // 存储到sessionStorage
        return
      }

      if (DateStore[i] === 'localStorage') {
        window.localStorage.setItem(cacheName, JSON.stringify(cacheData)) // 存储到localStorage
        return
      }

      if (DateStore[i] === 'window') {
        // @ts-ignore
        if (!window[CacheNameDBName] || typeof window[CacheNameDBName] !== 'object') window[CacheNameDBName] = {}
        // @ts-ignore
        window[CacheNameDBName][cacheName] = JSON.stringify(cacheData) // 存储到window
        return
      }
    }
  }

  if (!sessionData) return endCacheData // 如果没有找到缓存数据则直接返回

  const cacheData = (() => {
    if (DB) return sessionData // 如果是indexedDB则直接返回

    try {
      return JSON.parse(sessionData) // 尝试解析缓存数据
    } catch (error) {}
  })()
  if (!cacheData) return endCacheData // 如果解析失败则直接返回

  if (!cacheData || 'cacheNamedatatime' !== Object.keys(cacheData).sort().join('') || cacheData.time + params._isCache < +new Date()) {
    // 检查缓存是否过期
    setTimeout(() => {
      for (let i = 0; i < DateStore.length; i++) {
        if (DateStore[i] === 'indexedDB' && DB) {
          try {
            DB.delete(cacheName) // 从indexedDB删除过期缓存
            return
          } catch (error) {}
        }

        if (DateStore[i] === 'sessionStorage') {
          window.sessionStorage.removeItem(cacheName) // 从sessionStorage删除过期缓存
          return
        }

        if (DateStore[i] === 'localStorage') {
          window.localStorage.removeItem(cacheName) // 从localStorage删除过期缓存
          return
        }
      }
    }, 0)
    return endCacheData
  }

  cacheData.data._isCache = true // 标记数据为来自缓存
  endCacheData.cacheData = cacheData.data // 将缓存数据赋值给缓存数据对象

  return endCacheData
}
