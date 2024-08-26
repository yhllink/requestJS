import axios from 'axios'
import { loadModules, prefixInteger } from 'yhl-utils'

import { AnyObj, AxiosRequestConfig, Method, Params } from '..'
import handleFunction from './handleFunction'

const AXIOS = axios.create()

export default async function toRequest(
  method: Method,
  url: string,
  data: AnyObj,
  params: Params,
  axiosConfig: AxiosRequestConfig
): Promise<
  | {
      type: 'success'
      res: any
    }
  | {
      type: 'fail'
      statusText: string
      error: any
    }
> {
  const source = params._source
  if (source)
    axiosConfig.cancelToken = source?.token

    // 请求前最后一次回调 // 加密，验签
  ;[method, url, data, params, axiosConfig] = await handleFunction(params.__requestBeforeMiddleFn, method, url, data, params, axiosConfig)

  const _rid = (() => {
    if (!params._rid) return {}

    const date = new Date()
    // 时分秒
    const HH = prefixInteger(date.getHours(), 2)
    const mm = prefixInteger(date.getMinutes(), 2)
    const ss = prefixInteger(date.getSeconds(), 2)

    return { _rid: parseInt(HH + mm + ss).toString(32) }
  })()

  const isGetLike = ['GET', 'DELETE', 'HEAD', 'OPTIONS'].indexOf(method.toUpperCase()) > -1

  const transformResponse = await (async () => {
    const transformResponse = axiosConfig.transformResponse
      ? Array.isArray(axiosConfig.transformResponse)
        ? axiosConfig.transformResponse
        : [axiosConfig.transformResponse]
      : []

    if (params._Number2String) {
      const JSONParse = await loadModules<{
        (str: string): any
        init(): Promise<boolean>
      }>(() => import('../modules/JSONParse'))
      await JSONParse.init()
      transformResponse.unshift(function (data) {
        return JSONParse(data) || data
      })
    }

    return transformResponse
  })()

  const endAxiosConfig = await (() => {
    if (isGetLike) {
      return {
        ...axiosConfig,
        method,
        url,
        params: { ...(axiosConfig.params || {}), ...data, ..._rid },
        transformResponse,
      }
    }

    if (params._isUpLoad) {
      if (typeof axiosConfig.headers !== 'object') {
        axiosConfig.headers = {}
      }

      axiosConfig.headers['Content-Type'] = 'multipart/form-data; charset=UTF-8'
      data = new FormData()
      for (const key in data) {
        if (!data[key] || typeof data[key] === 'object' || Array.isArray(data[key])) {
          data.append(key, new Blob([JSON.stringify(data[key])], { type: 'application/json' }))
        } else {
          data.append(key, data[key])
        }
      }
    }

    return { ...axiosConfig, method, url, params: { ..._rid }, data, transformResponse }
  })()

  try {
    const res = await AXIOS(endAxiosConfig)
    return { type: 'success', res }
  } catch (error: any) {
    if (params._source && error.code === 'ERR_CANCELED' && error.name === 'CanceledError' && error.message === 'canceled') {
      return { type: 'fail', statusText: 'canceled', error }
    }
    return { type: 'fail', statusText: error.message, error }
  }
}
