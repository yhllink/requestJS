import { AnyObj, Params } from '..'

export default function handleRemoveUndefined(data: AnyObj, params: Params) {
  if (!params._removeUndefined) return data

  const datas: AnyObj = {}

  for (const key in data) {
    // 是否是 undefined
    if (data[key] !== undefined) {
      datas[key] = data[key]
    }
  }

  return datas
}
