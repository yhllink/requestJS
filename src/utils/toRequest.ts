import axios from 'axios'
import { prefixInteger } from 'yhl-utils'

import { AnyObj, AxiosRequestConfig, Method, Params } from '..'
import handleFunction from './handleFunction'
import getTransformResponse from './getTransformResponse'

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

  // 异步函数调用，用于获取经过特定转换后的响应
  // 此处的目的是通过传递参数和自定义的Axios配置来请求服务器，并将服务器的响应通过特定的方式转换
  // 参数params：函数的输入参数，包含请求所需的必要信息
  // 参数axiosConfig：自定义的Axios配置项，用于设定请求的详细行为，如请求头、请求方法等
  const transformResponse = await getTransformResponse(params, axiosConfig)

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