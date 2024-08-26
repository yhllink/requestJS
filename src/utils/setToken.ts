import { AnyObj, AxiosRequestConfig, Method, Params } from '..'

export default async function setToken(
  method: Method,
  url: string,
  data: AnyObj,
  params: Params,
  axiosConfig: AxiosRequestConfig
): Promise<[Params, AxiosRequestConfig]> {
  if (params.__getTokenFn) {
    const loginData = await params.__getTokenFn(method, url, data, params, axiosConfig)
    if (loginData) {
      loginData.data && (data = { ...data, ...loginData.data })
      loginData.headers && (axiosConfig.headers = { ...axiosConfig.headers, ...loginData.headers })
    }
  }

  return [data, axiosConfig]
}
