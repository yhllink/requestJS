import axios, { Method as MethodType, AxiosRequestConfig as AxiosRequestConfigType, CancelTokenSource, AxiosResponse, AxiosError } from 'axios'
import { hasVal } from 'yhl-utils'

import { OneLoadingManage } from './utils/oneLoadingManage'

import getInitOptions from './utils/getInitOptions'
import getHandleOptions from './utils/getHandleOptions'
import handleFunction from './utils/handleFunction'
import setToken from './utils/setToken'
import handleRemoveUndefined from './utils/handleRemoveUndefined'
import getCache, { clearCache, clearUserCache } from './utils/getCache'
import getLoadingMap from './utils/getLoadingMap'
import toRequest from './utils/toRequest'
import cacheReqCode from './utils/cacheReqCode'

type AndPromise<T> = T | Promise<T>

export type AnyObj = { [key: string]: any }
export type Method = MethodType
export type AxiosRequestConfig = AxiosRequestConfigType

// 获得中断请求的 source
export const getSource = function () {
  return axios.CancelToken.source()
}

type ResType = AxiosResponse<any, AnyObj> & { requestData: AxiosResponse['data'] } & {
  error: any
  __ress: { type: 'success'; res: any } | { type: 'fail'; statusText: string; error: any }
}

// 支持自定义属性，必须以$开头
type ParamsType = {
  baseURL?: string // 根路径
  timeout?: number // 超时时间   默认3s
  headers?: false | AxiosRequestConfig['headers'] // 请求头

  // 【1】设置当前请求参数的参数 用于做判断动态设置不同参数
  ___setCurrentParams?: (method: Method, url: string, data: AnyObj, params: Params, axiosConfig: AxiosRequestConfig) => Params

  // 【2】基础数据 //! 仅参数为Object生效
  _baseData?: false | AnyObj
  // 【3】基础数据回调 //! 仅返回为Object生效
  __getBaseDataFn?: false | ((method: Method, url: string, data: AnyObj, params: Params, axiosConfig: AxiosRequestConfig) => Promise<AnyObj>)

  // 【4】请求前回调
  __requestBeforeFn?:
    | false
    | ((
        method: Method,
        url: string,
        data: AnyObj,
        params: Params,
        axiosConfig: AxiosRequestConfig
      ) => AndPromise<void | {
        method?: Method // 可能被修改的请求方法
        url?: string // 可能被修改的请求URL
        data?: AnyObj // 可能被修改的请求数据
        params?: Params // 可能被修改的请求参数
        axiosConfig?: AxiosRequestConfig // 可能被修改的Axios配置
      }>)

  // 【5】设置token方法支持async
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
      }>)

  // 【6】删除参数中值为undefined的参数
  _removeUndefined?: boolean

  // 【7】缓存用户标识
  __getCacheUserTag?: () => string | void
  // 【8】缓存时间 单位ms
  _isCache?: false | number
  // 【9】缓存存储位置 默认['indexedDB','sessionStorage']//! 必须设置 _isCache 默认缓存
  _cacheDateStore?: ('indexedDB' | 'sessionStorage' | 'localStorage' | 'window')[]
  // 【21】判断是否需要缓存 //! 必须设置 _isCache 默认缓存
  _isCacheFn?: false | ((res: any) => Promise<void | boolean>)

  // 【10】是否开启防抖
  _debounce?: boolean
  // 【11】防抖时间  默认 500ms
  _debounceTime?: number

  // 【12】中断请求的 source
  _source?: CancelTokenSource

  // 【13】请求前最后一次回调 // 加密，验签
  __requestBeforeMiddleFn?:
    | false
    | ((
        method: Method,
        url: string,
        data: AnyObj,
        params: Params,
        axiosConfig: AxiosRequestConfig
      ) => AndPromise<void | {
        method?: Method // 可能被修改的请求方法
        url?: string // 可能被修改的请求URL
        data?: AnyObj // 可能被修改的请求数据
        params?: Params // 可能被修改的请求参数
        axiosConfig?: AxiosRequestConfig // 可能被修改的Axios配置
      }>)

  // 【14】请求随机数时间戳
  _rid?: boolean

  // 【15】post请求表单提交
  _isUpLoad?: boolean

  //! 开始发送请求

  // 【16】是否将相应的Number转成String  默认false
  _Number2String?: boolean

  // 【17】http请求失败提示
  __failHttpToastFn?: false | ((error: AxiosError, method: Method, url: string, data: AnyObj, params: Params, axiosConfig: AxiosRequestConfig) => void)

  // 【18】不需要返回结果
  _noReturn?: boolean

  // 【19】请求后第一次回调-返回数据将作为新的数据向后传递 // 解密，验签
  __requestAfterMiddleFn?: false | ((res: ResType, method: Method, url: string, data: AnyObj, params: Params, axiosConfig: AxiosRequestConfig) => AndPromise<void | ResType>)

  // 【20】请求后参数校验，可做相关提示   需要返回检查结果
  __requestReturnCodeCheckFn?: false | ((res: any, method: Method, url: string, data: AnyObj, params: Params, axiosConfig: AxiosRequestConfig) => AndPromise<boolean>)

  // 【22】请求后回调
  __requestAfterFn?:
    | false
    | ((type: 'success' | 'fail', res: any, method: Method, url: string, data: AnyObj, params: Params, axiosConfig: AxiosRequestConfig) => AndPromise<void | any>)

  // 【23】处理返回数据
  __handleResponseFn?: false | ((res: any) => any)
  // 【24】是否返回全部数据
  _responseAll?: boolean

  [key: `$${string}`]: any
}
export type Params = AxiosRequestConfig & ParamsType

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type FirstOptionType = {
  method: Method
  url: string
  data: AnyObj
  params: Params
}

/**
 * 请求方法
 */
async function request<T = any>(option: FirstOptionType): Promise<DeepPartial<T>>
async function request<T = any>(method: Method, url: string, data?: AnyObj, params?: Params): Promise<DeepPartial<T>>
async function request<T = any>(method: Method | FirstOptionType, url?: string, data?: AnyObj, params?: Params): Promise<DeepPartial<T>> {
  // 处理传入的参数
  ;[method, url = '', data = {}, params = {}] = getInitOptions(method, url, data, params)

  // 根据配置处理  data, params, axiosConfig
  let axiosConfig: AxiosRequestConfig = {}
  ;[data, params, axiosConfig] = await getHandleOptions(method, url, data, params, axiosConfig)

  // 请求前回调
  ;[method, url, data, params, axiosConfig] = await handleFunction(params.__requestBeforeFn, method, url, data, params, axiosConfig)

  // 设置token方法
  ;[data, axiosConfig] = await setToken(method, url, data, params, axiosConfig)

  // 剔除undefined
  data = handleRemoveUndefined(data, params)

  // 返回结果初始化
  let res: ResType = {
    data: {},
    status: 0,
    statusText: '',
    headers: {},
    // @ts-ignore
    config: {},
    error: {},
  }

  // 获取缓存数据
  const { cacheName, cacheData, setCache } = await getCache(method, url, data, params, axiosConfig)
  // 如果有缓存
  if (cacheData) res = cacheData

  if (!cacheData) {
    // 检查防抖
    const { loadingDataType, loadingData, loadEndFn } = await getLoadingMap(cacheName, params)
    // 如果处于防抖中
    if (loadingDataType && loadingData) {
      res = loadingData
    }

    // 如果没有在防抖 //! 发送请求
    else if (!loadingDataType && !loadingData) {
      const ress = await toRequest(method, url, data, params, axiosConfig)

      if (ress.type === 'success') {
        res = ress.res
        ress.res = undefined
      }

      if (ress.type === 'fail') {
        res.error = ress.error
        res.statusText = ress.statusText

        if (params.__failHttpToastFn) params.__failHttpToastFn(ress.error, method, url, data, params, axiosConfig)
      }

      res.__ress = ress

      // 防抖结果
      if (loadEndFn) loadEndFn(ress.type, res)
    }
  }

  const resType = res.__ress.type || 'success'

  // 请求后第一次回调-返回数据将作为新的数据向后传递
  if (params.__requestAfterMiddleFn) {
    const endRes = await params.__requestAfterMiddleFn(res, method, url, data, params, axiosConfig)
    if (hasVal(endRes) && typeof endRes === 'object') res = endRes
  }

  if (resType === 'success') {
    // 检查返回结果是否正确
    const resCheck = await cacheReqCode(res, method, url, data, params, axiosConfig)

    // 如果没有缓存
    if (!cacheData && resCheck && setCache && cacheName && params._isCache) {
      await (async () => {
        if (params._isCacheFn) {
          if (!(await params._isCacheFn(res))) return
        }
        setCache(res)
      })()
    }

    res.requestData = res.data
  }

  // 请求后回调
  if (params.__requestAfterFn) {
    if (res.__ress.type === 'success') {
      const resData = await params.__requestAfterFn(res.__ress.type, res.data, method, url, data, params, axiosConfig)
      if (resData && hasVal(resData)) res.data = resData
    }
    if (res.__ress.type === 'fail') {
      params.__requestAfterFn(res.__ress.type, res.error, method, url, data, params, axiosConfig)
    }
  }

  // 如果不需要返回结果
  if (params._noReturn) return res

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
 */
export function create(defaultParams: Omit<Params, '___setCurrentParams'> = {}) {
  if (Object.prototype.hasOwnProperty.call(defaultParams, '___setCurrentParams')) {
    // @ts-ignore
    delete defaultParams['___setCurrentParams']
  }

  function newRequest<T = any>(option: FirstOptionType): Promise<DeepPartial<T>>
  function newRequest<T = any>(method: Method, url: string, data?: AnyObj, params?: Params): Promise<DeepPartial<T>>
  function newRequest<T = any>(method: Method | FirstOptionType, url?: string, data?: AnyObj, params?: Params): Promise<DeepPartial<T>> {
    ;[method, url = '', data = {}, params = {}] = getInitOptions(method, url, data, params)
    return request(method, url, data, { ...defaultParams, ...params })
  }

  return newRequest
}

export { OneLoadingManage, clearCache, clearUserCache }
