import type { Method, RequestData, requestCommonReturn, Params } from '../index'

async function fetch(method: Method, url: string, data: RequestData, params: Params): Promise<requestCommonReturn> {
  window
    .fetch(url, {
      method,
      headers: params.headers ? params.headers : undefined,
    })
    .then((res) => {
      console.log(res)
    })

  return {
    status: 500,
    data: {},

    statusText: 'loading',
    params,
    headers: params.headers,
    request: null,
  }
}

fetch.hasFetch = () => typeof window.fetch !== 'undefined'
export default fetch
