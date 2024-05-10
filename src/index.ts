import axios, { Method as MethodType, AxiosRequestConfig as AxiosRequestConfigType, CancelTokenSource, AxiosResponse, AxiosError } from 'axios'
import { JSONParse, ifType, prefixInteger } from 'yhl-utils'

import getCache, { clearCache, clearUserCache } from './utils/getCache'
import getLoadingMap from './utils/getLoadingMap'

const CancelToken = axios.CancelToken

const AXIOS = axios.create({
  transformResponse: [
    function (data) {
      return JSONParse(data) || data
    },
  ],
})

type AndPromise<T> = T | Promise<T>

export type AnyObj = { [key: string]: any }
export type Method = MethodType
export type AxiosRequestConfig = AxiosRequestConfigType

// 获得中断请求的 source
export const getSource = function () {
  return CancelToken.source()
}

// 支持自定义属性，必须以$开头
type ParamsType = {
  baseURL?: string // 根路径
  timeout?: number // 超时时间   默认3s
  headers?: false | AxiosRequestConfig['headers'] // 请求头

  _source?: CancelTokenSource // 中断请求的 source

  _baseData?: false | AnyObj // 基础数据 //! 仅参数为Object生效
  __getBaseDataFn?: false | ((method: Method, url: string) => AnyObj) // 基础数据回调 //! 优先于_baseData   仅参数为Object生效

  _removeUndefined?: boolean // 删除参数中值为undefined的参数

  // 设置token方法支持async
  __getTokenFn?:
    | false
    | ((
        method: Method,
        url: string,
        data: AnyObj,
        params: Params,
        axiosConfig: AxiosRequestConfig
      ) => AndPromise<void | {
        data?: AnyObj // 登录参数
        headers?: AxiosRequestConfig['headers'] // 登录header
        // loginToken?: string // 登录标识token  切换用户后，清除其他用户缓存
      }>)

  __requestBeforeFn?:
    | false
    | ((
        method: Method,
        url: string,
        data: AnyObj,
        params: Params,
        axiosConfig: AxiosRequestConfig
      ) => AndPromise<void | {
        method?: Method
        url?: string
        data?: AnyObj
        params?: Params
        axiosConfig?: AxiosRequestConfig
      }>) // 请求前回调

  __requestBeforeMiddleFn?:
    | false
    | ((
        method: Method,
        url: string,
        data: AnyObj,
        params: Params,
        axiosConfig: AxiosRequestConfig
      ) => AndPromise<void | {
        method?: Method
        url?: string
        data?: AnyObj
        params?: Params
        axiosConfig?: AxiosRequestConfig
      }>) // 请求前最后一次回调 // 加密，验签

  _isCache?: false | number // 缓存时间 //! 必须设置 __requestReturnCodeCheckFn  并且校验结果为 true
  __getCacheUserTag?: () => string // 缓存用户标识
  _cacheDateStore?: ('indexedDB' | 'sessionStorage' | 'localStorage')[] // 缓存存储位置 默认['indexedDB','sessionStorage']
  _isCacheFn?: false | ((res: any) => Promise<void | boolean>) // 判断是否需要缓存 //! 必须设置 _isCache 默认缓存

  _debounce?: boolean // 是否开启防抖
  _debounceTime?: number // 防抖时间  默认 500ms

  _rid?: boolean // 请求随机数时间戳

  _isUpLoad?: boolean // post请求表单提交

  __handleResponseFn?: false | ((res: any) => any) // 处理返回数据 //! 优先级高于_responseAll
  _responseAll?: boolean // 是否返回全部数据

  _noReturn?: boolean // 不需要返回结果

  __failHttpToastFn?: false | ((error: AxiosError, method: Method, url: string, data: AnyObj, params: Params, axiosConfig: AxiosRequestConfig) => void) // http请求失败提示
  __failToastFn?: false | ((res: any) => void) // 请求失败提示

  __requestAfterMiddleFn?: false | ((res: any) => void | any) // 请求后第一次回调-返回数据将作为新的数据向后传递 // 解密，验签

  _responseLogin?: boolean // 接口返回 登录是否跳转
  __checkLoginFn?: false | ((res: any) => AndPromise<void | { login?: boolean; close?: boolean }>) // 接口返回检查是否是登录态
  __toLoginToast?: false | ((close: boolean) => void) // 当前需要登录态 跳转登录页提示
  __toLoginFn?: false | ((close: boolean) => void) // 当前需要登录态 跳转登录页方法

  __requestReturnCodeCheckFn?:
    | false
    | ((res: any, method: Method, url: string, data: AnyObj, params: Params, axiosConfig: AxiosRequestConfig) => AndPromise<boolean>) // 请求后参数校验，可做相关提示   需要返回检查结果

  __requestAfterFn?:
    | false
    | ((
        type: 'success' | 'fail',
        res: any,
        method: Method,
        url: string,
        data: AnyObj,
        params: Params,
        axiosConfig: AxiosRequestConfig
      ) => AndPromise<void | any>) // 请求后回调

  [key: `$${string}`]: any
}
export type Params = AxiosRequestConfig & ParamsType

// 默认配置
const defaultParams: Params = {
  withCredentials: true,
  baseURL: '',
  timeout: 3000,
  headers: {},

  _rid: true, // 请求随机数时间戳
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
type Request = <T = any>(method: Method, url: string, data?: AnyObj, params?: Params, axiosConfig?: AxiosRequestConfig) => Promise<DeepPartial<T>>

/**
 * 请求方法
 * @param method 请求方式 POST GET
 * @param url 请求url
 * @param data 请求的数据
 * @param params 请求配置项<Params>
 * @returns
 */
const request: Request = async function request<T = any>(
  method: Method,
  url: string,
  data: AnyObj = {},
  params: Params = {},
  axiosConfig: AxiosRequestConfig = {}
) {
  // 合并配置
  ;[params, axiosConfig] = (() => {
    const paramsProps = { ...defaultParams, ...params }

    const endParams: Params = {}
    const endAxiosConfig: AxiosRequestConfig = axiosConfig

    for (const key in paramsProps) {
      if (key[0] === '_' || key[0] === '$') {
        // @ts-ignore
        endParams[key] = paramsProps[key]
      } else {
        // @ts-ignore
        endAxiosConfig[key] = paramsProps[key]
      }
    }

    return [endParams, endAxiosConfig]
  })()

  // 合并请求参数
  data = (() => {
    if (typeof data !== 'object' || !ifType('Object', data)) return data

    // 处理基础数据方法
    if (params.__getBaseDataFn) {
      const baseDataFn = params.__getBaseDataFn(method, url)
      if (typeof baseDataFn === 'object' && ifType('Object', baseDataFn)) {
        data = { ...baseDataFn, ...data }
      }
    }

    // 处理基础数据
    else if (params._baseData && typeof params._baseData === 'object' && ifType('Object', params._baseData)) {
      data = { ...params._baseData, ...data }
    }

    return data
  })()

  // 请求前回调
  if (params.__requestBeforeFn) {
    const dataAfterFnData = await params.__requestBeforeFn(method, url, data, params, axiosConfig)
    if (dataAfterFnData) {
      dataAfterFnData.method && (method = dataAfterFnData.method)
      dataAfterFnData.url && (url = dataAfterFnData.url)
      dataAfterFnData.data && (data = dataAfterFnData.data)
      dataAfterFnData.params && (params = dataAfterFnData.params)
      dataAfterFnData.axiosConfig && (axiosConfig = dataAfterFnData.axiosConfig)
    }
  }

  // 设置token方法支持async
  if (params.__getTokenFn) {
    const loginData = await params.__getTokenFn(method, url, data, params, axiosConfig)
    if (loginData) {
      loginData.data && (data = { ...data, ...loginData.data })
      loginData.headers && (axiosConfig.headers = { ...axiosConfig.headers, ...loginData.headers })
    }
  }

  // 剔除undefined
  if (params._removeUndefined) {
    data = (() => {
      if (typeof data !== 'object' || !ifType('Object', data)) return data

      const datas: AnyObj = {}

      for (const key in data) {
        // 是否是 undefined
        if (data[key] !== undefined) {
          datas[key] = data[key]
        }
      }

      return datas
    })()
  }

  // 返回结果初始化
  let res: AxiosResponse<any, AnyObj> & { requestData: AxiosResponse['data'] } = {
    data: {},
    status: 0,
    statusText: '',
    headers: {},
    // @ts-ignore
    config: {},
  }

  // 获取缓存数据
  const { cacheName, cacheData, setCache } = await getCache(method, url, data, params, axiosConfig)
  // 如果有缓存
  if (cacheData) res = cacheData

  // 检查防抖
  const { loadingDataType, loadingData, loadEndFn } = await getLoadingMap(cacheName, params)
  // 如果处于防抖中
  if (loadingDataType && loadingData) {
    // 请求后回调
    if (params.__requestAfterFn) {
      params.__requestAfterFn(loadingDataType, loadingData, method, url, data, params, axiosConfig)
    }

    // 如果不需要返回结果
    if (params._noReturn) return

    if (loadingDataType === 'fail') {
      return Promise.reject(loadingData)
    }

    res = loadingData
  }

  // 如果没有缓存 //! 发送请求
  if (!loadingDataType && !loadingData && !cacheData) {
    const source = params._source
    if (source) axiosConfig.cancelToken = source?.token

    // 最后的请求参数
    let endData = data

    // 请求前最后一次回调 // 加密，验签
    if (params.__requestBeforeMiddleFn) {
      const dataAfterFnData = await params.__requestBeforeMiddleFn(method, url, data, params, axiosConfig)
      if (dataAfterFnData) {
        dataAfterFnData.method && (method = dataAfterFnData.method)
        dataAfterFnData.url && (url = dataAfterFnData.url)
        dataAfterFnData.data && (endData = dataAfterFnData.data)
        dataAfterFnData.params && (params = dataAfterFnData.params)
        dataAfterFnData.axiosConfig && (axiosConfig = dataAfterFnData.axiosConfig)
      }
    }

    try {
      const _rid = params._rid
        ? (() => {
            const date = new Date()
            // 时分秒
            const HH = prefixInteger(date.getHours(), 2)
            const mm = prefixInteger(date.getMinutes(), 2)
            const ss = prefixInteger(date.getSeconds(), 2)

            return parseInt(HH + mm + ss).toString(32)
          })()
        : undefined

      const isGetLike = ['GET', 'DELETE', 'HEAD', 'OPTIONS'].indexOf(method.toUpperCase()) > -1

      if (isGetLike) {
        res = await AXIOS({
          ...axiosConfig,
          method,
          url,
          params: { ...(axiosConfig.params || {}), ...endData, _rid },
        })
      } else {
        if (params._isUpLoad) {
          if (typeof axiosConfig.headers !== 'object') {
            axiosConfig.headers = {}
          }

          axiosConfig.headers['Content-Type'] = 'multipart/form-data; charset=UTF-8'
          endData = new FormData()
          for (const key in data) {
            if (ifType([Object, Array], data[key])) {
              endData.append(key, new Blob([JSON.stringify(data[key])], { type: 'application/json' }))
            } else {
              endData.append(key, data[key])
            }
          }
        }

        res = await AXIOS({ ...axiosConfig, method, url, params: { _rid }, data: endData })
      }

      // 防抖结果
      if (loadEndFn) loadEndFn('success', res)
    } catch (error: any) {
      if (params._source && error.code === 'ERR_CANCELED' && error.name === 'CanceledError' && error.message === 'canceled') {
        res = { ...res, statusText: 'canceled' }
      } else {
        res = { ...res, statusText: error.message }
      }

      // 请求后回调
      if (params.__requestAfterFn) {
        params.__requestAfterFn('fail', error, method, url, data, params, axiosConfig)
      }

      params.__failHttpToastFn && params.__failHttpToastFn(error, method, url, data, params, axiosConfig)

      // 防抖结果
      if (loadEndFn) loadEndFn('fail', res)

      // 如果不需要返回结果
      if (params._noReturn) return
      return Promise.reject(res)
    }
  }

  // 请求后第一次回调-返回数据将作为新的数据向后传递
  if (params.__requestAfterMiddleFn) {
    const endRes = params.__requestAfterMiddleFn(res)
    if ((endRes ?? '666') !== '666') res = endRes
  }

  // 检查登录提示
  const isLogin = await (async () => {
    const { login: isLogin, close: isClose } =
      (await (async () => {
        if (!params._responseLogin || !params.__checkLoginFn) return { login: true, close: false }
        return await params.__checkLoginFn(res)
      })()) || {}

    // 如果设置了登录 判断
    if (!isLogin && params._responseLogin) {
      // 如果未登录  登录提示
      if (params.__toLoginToast) {
        params.__toLoginToast(!!isClose)
      }

      // 如果未登录
      if (params.__toLoginFn) {
        params.__toLoginFn(!!isClose)
      }

      return false
    }

    return isLogin
  })()

  // 检查返回结果是否正确
  const resCheck = await (async () => {
    // 请求后参数校验，可做相关提示
    if (params.__requestReturnCodeCheckFn) {
      return await params.__requestReturnCodeCheckFn(res, method, url, data, params, axiosConfig)
    }

    return true
  })()

  // 如果没有缓存
  if (!cacheData && isLogin && resCheck && setCache && cacheName && params._isCache) {
    await (async () => {
      if (params._isCacheFn) {
        const canCache = await params._isCacheFn(res)
        if (!canCache) return
      }

      setCache(res)
    })()
  }

  res.requestData = res.data

  // 请求后回调
  if (params.__requestAfterFn) {
    const resData = await params.__requestAfterFn('success', res.data, method, url, data, params, axiosConfig)
    if ((resData ?? '666') !== '666') res.data = resData
  }

  // 如果不需要返回结果
  if (params._noReturn) return

  // 如果自定义了返回处理
  if (params.__handleResponseFn) {
    return params.__handleResponseFn(res)
  }

  // 是否设置了 返回全部结果
  return params._responseAll ? res : res.data
}
export default request

/**
 * 创建请求方法
 * @param {Params} defaultParams
 * @param {AxiosRequestConfig} defaultAxiosConfig
 * @returns {Request}
 */
export const create = function (defaultParams: Params, defaultAxiosConfig: AxiosRequestConfig = {}) {
  const newRequest: Request & { clearCache: () => void; clearUserCache: () => void } = function newRequest<T = any>(
    method: Method,
    url: string,
    data: AnyObj = {},
    params: Params = {},
    axiosConfig: AxiosRequestConfig = {}
  ) {
    return request<T>(method, url, data, { ...defaultParams, ...params }, { ...defaultAxiosConfig, ...axiosConfig })
  }

  newRequest.clearCache = clearCache
  newRequest.clearUserCache = clearUserCache
  return newRequest
}
