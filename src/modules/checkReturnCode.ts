import type { Params } from '../index'

import { structure } from 'yhl-utils'

// 检查code 并提示
export default function checkReturnCode(res: any = {}, params: Params) {
  // 设置默认 code检查 结果
  let returnCode = true

  // 是否设置 code  并且设置了 提示
  if (Array.isArray(params.codeKey) && Array.isArray(params.successCode) && (params.successToast || params.failToast)) {
    // 设置默认 code检查 结果
    returnCode = false

    out: for (let i = 0, l = params.codeKey.length; i < l; i++) {
      if (returnCode) break

      // 获取code
      const code = structure(params.codeKey[i], res.data, '')

      // 当前code  是否 为成功状态
      for (let i = 0; i < params.successCode.length; i++) {
        if (returnCode) break out

        // 数组标识
        let isArray = false
        // 获取循环状态码
        let successCode: any = params.successCode[i]
        // 判断数组
        if (Array.isArray(successCode)) {
          // 如果是多个
          if (successCode.length > 1) {
            isArray = true
          } else {
            // 否则算单个
            successCode = successCode[0]
          }
        }

        // 如果是数组
        if (isArray) {
          // 如果是范围值
          returnCode = code >= successCode[0] && code <= successCode[1]
        } else {
          // 如果是固定值设置 code检查 结果
          returnCode = successCode == code
        }
      }
    }

    // 成功
    if (returnCode && params.successToast && params.toastFn) {
      let message = '成功'
      if (params.successToastKey) {
        for (let i = 0, l = params.successToastKey.length; i < l; i++) {
          const val = structure(params.successToastKey[i], res.data, false)
          if (val) {
            message = val
            break
          }
        }
      }
      params.toastFn('success', message)
    }

    // 失败
    if (!returnCode && params.failToast && params.toastFn) {
      let message = '请求失败'
      if (params.failToastKey) {
        for (let i = 0, l = params.failToastKey.length; i < l; i++) {
          const val = structure(params.failToastKey[i], res, false)
          if (val) {
            message = val
            break
          }
        }
        for (let i = 0, l = params.failToastKey.length; i < l; i++) {
          const val = structure(params.failToastKey[i], res.data, false)
          if (val) {
            message = val
            break
          }
        }
      }

      params.toastFn('fail', message)
    }
  }

  // 返回 code检查 结果
  return returnCode
}
