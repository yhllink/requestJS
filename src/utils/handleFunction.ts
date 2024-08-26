import { hasVal } from 'yhl-utils'

// 导入类型定义，包括AnyObj、AxiosRequestConfig、Method和Params
import { AnyObj, AxiosRequestConfig, Method, Params } from '..'

// 默认导出一个函数，用于应用处理函数到请求配置上
// 这个函数接收一个处理函数和请求配置，然后调用处理函数返回修改后的配置
// 这对于在发送请求前动态修改请求配置非常有用
export default async function handleFunction(
  func: Function | any,
  method: Method,
  url: string,
  data: AnyObj,
  params: Params,
  axiosConfig: AxiosRequestConfig
): Promise<
  [
    method: Method, // 可能被修改的请求方法
    url: string, // 可能被修改的请求URL
    data: AnyObj, // 可能被修改的请求数据
    params: Params, // 可能被修改的请求参数
    axiosConfig: AxiosRequestConfig // 可能被修改的Axios配置
  ]
> {
  if (typeof func === 'function') {
    const res = await func(method, url, data, params, axiosConfig)
    if (hasVal(res) && typeof res === 'object') {
      res.method && (method = res.method)
      res.url && (url = res.url)
      res.data && (data = res.data)
      res.params && (params = res.params)
      res.axiosConfig && (axiosConfig = res.axiosConfig)
    }
  }

  return [method, url, data, params, axiosConfig]
}
