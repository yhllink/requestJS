import { AnyObj, AxiosRequestConfig, FirstOptionType, Method, Params } from '..'

/**
 * 根据传入的请求选项和参数，生成最终的请求配置数组
 *
 * @param option 请求方法或包含请求信息的对象
 * @param url 请求的URL地址（可选）
 * @param data 请求的数据负载（可选）
 * @param params 请求的参数（可选）
 * @param axiosConfig Axios请求的额外配置（可选）
 * @returns 返回一个包含请求方法、URL、数据负载、请求参数和Axios配置的数组
 *
 * 此函数旨在处理请求配置的多样性，无论是作为单独参数传递还是作为一个包含所有信息的对象传递，
 * 它都能生成统一的请求配置数组，以便后续步骤统一处理这些请求细节。
 */
export default function getEndOptions(option: Method | FirstOptionType, url?: string, data?: AnyObj, params?: Params): [Method, string, AnyObj, Params] {
  // 如果传入的option是一个对象，则直接返回其包含的所有请求信息
  if (typeof option === 'object') return [option.method, option.url, option.data, option.params]
  // 否则，根据传入的单独参数构建请求信息，并处理未传入参数的默认值
  return [option, url ?? '', data ?? {}, params ?? {}]
}
