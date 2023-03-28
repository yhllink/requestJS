import type { RequestData, requestCommonReturn, Params, MethodUpper } from '../index'

function fetch(method: MethodUpper, isGetLike: boolean, url: string, dataUrl: string, data: RequestData, params: Params): Promise<requestCommonReturn> {
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
    if (!fetch.hasFetch()) return resolve(res)

    const controller = new AbortController()
    const signal = controller.signal

    if (params.timeout) 1

    window
      .fetch(dataUrl, {
        signal,
        method,
        headers: params.headers ? params.headers : undefined,
        body: isGetLike ? undefined : JSON.stringify(data),
      })
      .then(
        async (response) => {
          res.status = response.status
          res.statusText = 'OK'
          res.data = await response.text()

          resolve(res)
        },
        (err) => {
          console.log(err)
        }
      )
  })
}

fetch.hasFetch = () => typeof window.fetch === 'function'
export default fetch
