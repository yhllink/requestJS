export type Method = 'get' | 'GET' | 'delete' | 'DELETE' | 'head' | 'HEAD' | 'options' | 'OPTIONS' | 'post' | 'POST' | 'put' | 'PUT'

export type RequestData = { [key: string]: any }

export type requestCommonReturn = {
  status: number
  data: any

  statusText: string
  params: Params
  headers: Params['headers']
  request: any
  requestData?: any
}

type AxiosMiddleFunction = (
  method: Method,
  url: string,
  data: RequestData,
  params: Params
) => { method?: Method; url?: string; data?: RequestData; params?: Params }

export interface Params {
  baseURL?: false | string // 根路径
  baseAPI?: false | string // 根api路径

  timeout?: number
  headers?: false | { [key: string]: string } // 请求头

  rid?: boolean // 请求随机数时间戳
  ridKey?: string // 请求随机数发送字段 默认 _rid
  getRidFn?: () => string | Promise<string> // 自定义生成随机数规则

  structureDuplication?: boolean // 是否解决返回结构重复问题

  noReturn?: boolean // 不需要返回结果

  isCache?: false | number // 缓存时间 //! 依赖于 codeKey & successCode
  isCacheFn?: false | ((res: any) => void | boolean | Promise<void | boolean>) // 判断是否需要缓存 //! 必须设置 isCache
  openIndexedDB?: boolean // 是否开启indexDB缓存
  isLoginCache?: boolean // 是否登录缓存
  getLoginCacheUniqueFn?: false | (() => string | Promise<string>) // 获取登录缓存唯一标识

  debounce?: boolean // 是否开启防抖
  debounceTime?: number // 防抖数据缓存时间 // 默认 3000

  baseData?: false | object // 基础数据
  baseDataFn?: false | Function // 基础数据回调

  delUndefined?: boolean // 删除参数中值为undefined的参数
  responseAll?: boolean // 是否返回全部数据

  tokenKey?: false | string // token添加时的key
  tokenFn?: false | (() => string | void | Promise<string | void>) // token获取方法支持async
  tokenHeader?: boolean // token是否添加在header头
  requiredToken?: boolean // 是否必传token（会跳转登录页 //! 依赖于 toLoginFn
  requiredTokenClose?: boolean // 是否必传 token 并关闭 （会跳转登录页并关闭页面 //! 依赖于 requiredToken & toLoginFn
  checkTokenFailReturn?: boolean // 检查token失败 是否直接返回失败 //! 依赖于 codeKey & successCode & failToastKey

  responseLogin?: boolean // 接口返回 登录是否跳转
  responseLoginKey?: false | string // 接口返回登录key
  responseLoginVal?: false | number[] // 接口返回登录val
  responseLoginClose?: boolean // 接口返回登录并关闭 （会跳转登录页并关闭页面 //! 依赖于 responseLogin & responseLoginKey & responseLoginVal

  toLoginFn?: false | Function // 跳转登录页面方法 支持async

  codeKey?: false | string[] // 状态码key
  successCode?: false | (number | string)[] // 成功状态码200

  toastFn?: (type: 'success' | 'fail', msg: string) => any // 显示toast方法

  successToast?: boolean // 成功提示 //! 依赖于 toastFn
  successToastKey?: false | string[] // 成功提示语key
  failToast?: boolean // 失败提示 //! 依赖于 toastFn
  failToastKey?: false | string[] // 失败提示语 key

  dataBeforeFn?: false | AxiosMiddleFunction // 数据处理前回调
  requestBeforeFn?: false | AxiosMiddleFunction // 请求前回调
  requestBeforeMiddleFn?: false | AxiosMiddleFunction // 请求前最后一次回调 // 加密，验签

  dataAfterMiddleFn?: false | ((data: any) => any | Promise<any>) // 请求后第一次回调 // 解密，验签
  requestAfterFn?: false | ((type: 'success' | 'fail', data: any) => any) // 请求后回调
}

import checkReturnCode from './modules/checkReturnCode'
import checkReturnLogin from './modules/checkReturnLogin'
import { getCache, setCache } from './modules/requestCache'
import getLoadingMap from './modules/getLoadingMap'
import getRid from './modules/getRid'
import removeUndefined from './modules/removeUndefined'
import setBase from './modules/setBase'
import setBaseData from './modules/setBaseData'
import setHeaders from './modules/setHeader'
import setToken from './modules/setToken'
import fetch from './modules/fetch'
// import xhr from './modules/xhr'

const requset = async function (
  methodStart: Method,
  urlStart: string,
  dataStart?: RequestData,
  paramsStart?: Params
): Promise<requestCommonReturn | requestCommonReturn['data'] | void> {
  // 获取基础参数
  let { method, url, params } = setBase(methodStart, urlStart, paramsStart)

  // 请求参数
  let data: RequestData = {}

  // 获取请求参数
  data = setBaseData(params, dataStart)

  // 数据处理前回调
  if (params.dataBeforeFn) {
    const beforeData = params.dataBeforeFn(method, url, data, params)
    if (beforeData) {
      if (beforeData.method) method = beforeData.method.toUpperCase() as Method
      if (beforeData.url) url = beforeData.url
      if (beforeData.data) data = beforeData.data
      if (beforeData.params) params = beforeData.params
    }
  }

  // 设置token 并判断是否必须 是否需要跳转
  const tokenData = await setToken(params, data)
  if (tokenData.noLoginReturn) return {}
  if (tokenData.data) data = tokenData.data
  if (tokenData.headers) params.headers = tokenData.headers

  // 请求前回调
  if (params.requestBeforeFn) {
    const requestBeforeData = params.requestBeforeFn(method, url, data, params)
    if (requestBeforeData) {
      if (requestBeforeData.method) method = requestBeforeData.method.toUpperCase() as Method
      if (requestBeforeData.url) url = requestBeforeData.url
      if (requestBeforeData.data) data = requestBeforeData.data
      if (requestBeforeData.params) params = requestBeforeData.params
    }
  }

  // 剔除undefined
  if (params.delUndefined) data = removeUndefined(data)

  // 返回结果初始化
  let res: requestCommonReturn = {
    status: 500,
    data: {},

    statusText: 'loading',
    params,
    headers: params.headers,
    request: null,
  }
  // 最后的请求参数
  let endData = data

  // 请求前最后一次回调 // 加密，验签
  if (params.requestBeforeMiddleFn) {
    const axiosBeforeData = params.requestBeforeMiddleFn(method, url, data, params)
    if (axiosBeforeData) {
      if (axiosBeforeData.method) method = axiosBeforeData.method.toUpperCase() as Method
      if (axiosBeforeData.url) url = axiosBeforeData.url
      if (axiosBeforeData.data) endData = axiosBeforeData.data
      if (axiosBeforeData.params) params = axiosBeforeData.params
    }
  }

  const { DB, cacheName, cacheData } = await getCache(method, url, endData, params)

  // 如果缓存数据存在
  if (cacheData) {
    res = {
      status: 200,
      data: cacheData,

      statusText: 'OK',
      params,
      headers: params.headers,
      request: null,
    }
  }

  const { loadingData, loadEndFn } = await getLoadingMap(cacheName, params)
  if (loadingData) res = loadingData

  // 如果没有缓存
  if (!loadingData && !cacheData) {
    // 随机生成rid，涉及验签参数需前置
    if (['GET', 'DELETE', 'HEAD', 'OPTIONS'].indexOf(method) > -1 && params.rid) {
      endData[typeof params.ridKey === 'string' ? params.ridKey : '_rid'] = params.getRidFn ? await params.getRidFn() : getRid()
    }

    // res = await (fetch.hasFetch() ? fetch(method, url, endData, params) : xhr(method, url, endData, params))
    res = fetch.hasFetch() ? await fetch(method, url, endData, params) : res

    // 请求后第一次回调 // 加密，验签
    if (params.dataAfterMiddleFn) {
      res.data = await params.dataAfterMiddleFn(res.data)
    }

    // 处理重复结构数据
    if (params.structureDuplication && res.data.data && Object.keys(res.data).join(',') === Object.keys(res.data.data).join(',')) {
      res.data = res.data.data
    }
  }

  if (loadEndFn) loadEndFn(res)

  let noLogin
  // 如果需要返回结果
  if (!params.noReturn) {
    // 检查登录提示
    noLogin = checkReturnLogin(res, params)
  }

  // 如果没有缓存
  if (!cacheData) {
    // 检查code 并提示
    const CodeCheck = noLogin ? false : checkReturnCode(res, <Params>params)

    // 如果开启了缓存
    if (cacheName && params.isCache && CodeCheck) {
      // 如果数据有效
      if (res.data !== null && res.data !== undefined && !(Array.isArray(res.data) && res.data.length === 0)) {
        setCache(cacheName, DB, params, urlStart, endData, res.data)
      }
    }
  }

  // 请求后回调
  if (params.requestAfterFn) {
    const data = params.requestAfterFn('success', res.data)
    if (data) {
      res.requestData = res.data
      res.data = data
    }
  }

  // 如果不需要返回结果
  if (params.noReturn) return

  // 是否设置了 返回全部结果
  if (params.responseAll) {
    return res
  } else {
    return res.data
  }
}

// 设置请求默认值
requset.create = function (params: Params) {
  return function (methodStart: Method = 'post', urlStart: string, dataStart?: RequestData, paramsStart?: Params) {
    return requset(methodStart, urlStart, dataStart, {
      ...params,
      ...paramsStart,
      // 设置请求头
      headers: setHeaders(params, paramsStart),
    })
  }
}
export default requset
