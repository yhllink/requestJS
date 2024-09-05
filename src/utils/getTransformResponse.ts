import { JSONParse } from 'yhl-utils'

import { AxiosRequestConfig, Params } from '..'

export default async function getTransformResponse(params: Params, axiosConfig: AxiosRequestConfig) {
  if (!params._Number2String) return

  const transformResponse = axiosConfig.transformResponse
    ? Array.isArray(axiosConfig.transformResponse)
      ? axiosConfig.transformResponse
      : [axiosConfig.transformResponse]
    : []

  await JSONParse.init()
  transformResponse.unshift(function (data) {
    return JSONParse(data) || data
  })

  return transformResponse
}
