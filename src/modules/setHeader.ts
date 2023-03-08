import type { Params } from '../index'

// 设置请求头
export default function setHeaders(params?: Params, paramsStart?: Params): Params['headers'] {
  let header: Params['headers'] = {}

  if (typeof params?.headers === 'object') {
    for (const key in params.headers) {
      header[key] = params.headers[key]
    }
  }

  if (typeof paramsStart?.headers === 'object') {
    for (const key in paramsStart.headers) {
      header[key] = paramsStart.headers[key]
    }
  }

  return header
}
