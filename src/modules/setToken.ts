import type { RequestData, Params } from '../index'

// 设置token
export default async function setToken(
  params: Params,
  data: RequestData
): Promise<{ headers: Params['headers']; data: RequestData; token: string; noLoginReturn: boolean }> {
  let noLoginReturn: boolean = false
  let token: string = ''

  // 如果设置了 token key
  if (params.tokenKey && params.tokenFn) {
    const newToken = await params.tokenFn()
    if (newToken) token = newToken

    // 如果有token
    if (token) {
      // 是否添加请求头
      if (params.tokenHeader) {
        if (!params.headers) params.headers = {}
        params.headers[params.tokenKey] = token
      } else {
        data[params.tokenKey] = token
      }
    }
    // 如果没有token
    else {
      // 判断token 是否必填
      if (params.requiredToken && params.toLoginFn) {
        let isClose = false
        // 判断是否关闭 页面
        if (params.requiredTokenClose) isClose = true
        params.toLoginFn(isClose)
        noLoginReturn = true
      }
    }
  }

  return { data, headers: params.headers, token, noLoginReturn }
}
