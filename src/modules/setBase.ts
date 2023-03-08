import type { Method, Params } from '../index'

// 设置基础参数
export default function setBase(
  methodStart: Method = 'post',
  urlStart: string = '',
  paramsStart: Params = {}
): {
  method: Method
  url: string
  params: Params
} {
  const method = methodStart.toUpperCase() as Method
  const params: Params = { ...paramsStart }

  const url = (params.baseURL || '') + (params.baseAPI || '') + urlStart

  return { method, url, params }
}
