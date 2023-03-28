import type { RequestData, requestCommonReturn, Params, MethodUpper } from '../index'

export default function xhr(
  method: MethodUpper,
  isGetLike: boolean,
  url: string,
  dataUrl: string,
  data: RequestData,
  params: Params
): Promise<requestCommonReturn> {
  return new Promise((resolve) => {
    const res: requestCommonReturn = {
      status: 500,
      data: {},

      url,
      statusText: 'error',
      params,
      headers: params.headers,
      request: null,
    }

    const xhr = new XMLHttpRequest()

    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return

      res.status = xhr.status
      res.data = xhr.responseText

      resolve(res)
    }

    xhr.open(method, dataUrl, false)
    if (params.headers) {
      for (const key in params.headers) {
        xhr.setRequestHeader(key, params.headers[key])
      }
    }
    xhr.send(isGetLike ? '' : JSON.stringify(data))
  })
}
