import { AnyObj, AxiosRequestConfig, Method, Params } from '..'

export default async function cacheReqCode(res: any, method: Method, url: string, data: AnyObj, params: Params, axiosConfig: AxiosRequestConfig) {
  if (params.__requestReturnCodeCheckFn) {
    return await params.__requestReturnCodeCheckFn(res, method, url, data, params, axiosConfig)
  }
  return true
}
