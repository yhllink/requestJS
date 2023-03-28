import type { Method, MethodUpper, Params } from '../index'

// 设置基础参数
export default function setBase(
  methodStart: Method,
  urlStart: string = '',
  paramsStart: Params = {}
): {
  method: MethodUpper
  url: string
  params: Params
} {
  const method = methodStart.toUpperCase() as MethodUpper
  const params: Params = { ...paramsStart }

  const url = (params.baseURL || '') + (params.baseAPI || '') + urlStart

  if (!params.headers) params.headers = {}

  return { method, url, params }
}
