import { AnyObj, AxiosRequestConfig, Method, Params } from '..'

// 定义默认的请求参数配置
const defaultParams: Params = {
  withCredentials: true, // 默认允许发送凭证（如cookies）
  baseURL: '', // 基础URL为空，需后续设置
  timeout: 3000, // 默认请求超时时间为3000毫秒
  headers: {}, // 默认请求头为空对象
  _rid: true, // 请求随机数时间戳，用于防止缓存
}

/**
 * 异步处理请求参数和axios配置的函数
 * @param method 请求方法（GET、POST等）
 * @param url 请求的URL
 * @param data 请求的数据负载
 * @param params 用户传入的请求参数
 * @param axiosConfig axios的配置对象
 * @returns 返回一个包含最终请求参数和axios配置的Promise
 */
async function handleParamsAndAxiosConfig(
  method: Method,
  url: string,
  data: AnyObj,
  params: Params,
  axiosConfig: AxiosRequestConfig
): Promise<[Params, AxiosRequestConfig]> {
  // 合并默认参数和用户参数
  const paramsProps = { ...defaultParams, ...params }

  // 如果存在设置当前参数的函数，则调用它以动态设置参数
  const currentParams: Params = paramsProps.___setCurrentParams ? await paramsProps.___setCurrentParams(method, url, data, paramsProps, axiosConfig) : {}
  // 将动态参数合并到paramsProps中
  for (const key in currentParams) {
    if (!Object.prototype.hasOwnProperty.call(paramsProps, key)) {
      // @ts-ignore
      paramsProps[key] = currentParams[key]
    }
  }

  // 初始化最终的请求参数和axios配置对象
  const endParams: Params = {}
  const endAxiosConfig: AxiosRequestConfig = axiosConfig

  // 根据参数的前缀，分离axios配置参数和请求参数
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
}

/**
 * 默认导出的函数，用于获取处理后的请求选项
 * @param method 请求方法（GET、POST等）
 * @param url 请求的URL
 * @param data 请求的数据负载
 * @param params 用户传入的请求参数
 * @param axiosConfig axios的配置对象
 * @returns 返回一个包含处理后的数据、请求参数和axios配置的Promise
 */
export default async function getHandleOptions(
  method: Method,
  url: string,
  data: AnyObj,
  params: Params,
  axiosConfig: AxiosRequestConfig
): Promise<[AnyObj, Params, AxiosRequestConfig]> {
  // 调用handleParamsAndAxiosConfig处理参数和配置
  ;[params, axiosConfig] = await handleParamsAndAxiosConfig(method, url, data, params, axiosConfig)

  // 处理基础数据
  if (params._baseData && typeof params._baseData === 'object') {
    data = { ...params._baseData, ...data } // 将_baseData合并到请求数据中
  }

  // 处理基础数据方法
  if (params.__getBaseDataFn) {
    const baseDataFn = await params.__getBaseDataFn(method, url, data, params, axiosConfig)
    if (baseDataFn && typeof baseDataFn === 'object') {
      data = { ...baseDataFn, ...data } // 将基础数据合并到请求数据中
    }
  }

  return [data, params, axiosConfig] // 返回处理后的数据、参数和axios配置
}
