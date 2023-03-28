import type { RequestData, Params, MethodUpper } from '../index'

// 设置参数
export default function setBaseData(method: MethodUpper, url: string, params: Params, dataStart: RequestData = {}): RequestData {
  let data: RequestData = {}

  // 处理基础数据
  if (params.baseData) data = { ...data, ...params.baseData }

  // 处理基础数据方法
  if (params.baseDataFn) {
    const baseDataFnData = params.baseDataFn(method, url)
    if (baseDataFnData) data = { ...data, ...baseDataFnData }
  }

  // 处理数据
  if (dataStart) data = { ...data, ...dataStart }

  return data
}
