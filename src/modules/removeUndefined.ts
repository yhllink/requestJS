import type { RequestData } from '../index'

// 删除对象中的Undefined
export default function removeUndefined(data: RequestData): RequestData {
  const datas: { [key: string]: any } = {}

  for (const key in data) {
    // 是否是 undefined
    if (data[key] !== undefined) {
      datas[key] = data[key]
    }
  }

  return datas
}
