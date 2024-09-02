import type { JSONParse as JSONParseType } from 'yhl-utils'

import { loadModules } from 'yhl-utils'

import { AxiosRequestConfig, Params } from '..'

export default async function getTransformResponse(params: Params, axiosConfig: AxiosRequestConfig) {
  if (params._Number2String) {
    const transformResponse = axiosConfig.transformResponse
      ? Array.isArray(axiosConfig.transformResponse)
        ? axiosConfig.transformResponse
        : [axiosConfig.transformResponse]
      : []

    const JSONParse = await loadModules<typeof JSONParseType>(() => import('yhl-utils/es/JSONParse/JSONParse'))
    await JSONParse.init()
    transformResponse.unshift(function (data) {
      return JSONParse(data) || data
    })

    return transformResponse
  }
}
