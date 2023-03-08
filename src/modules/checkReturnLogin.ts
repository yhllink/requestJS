import type { Params } from '../index'

import { structure } from 'yhl-utils'

// 检查登录提示
export default function checkReturnLogin(res: any = {}, params: Params) {
  // 如果设置了登录 判断
  if (params.responseLogin && params.toLoginFn) {
    // 获取登录 字段返回值
    const login = structure(params.responseLoginKey || '', res.data)

    if (Array.isArray(params.responseLoginVal)) {
      // 返回值是否为 预设值
      for (let i = 0, l = params.responseLoginVal.length; i < l; i++) {
        if (login == params.responseLoginVal[i]) {
          let isClose = false
          // 判断是否关闭 页面
          if (params.responseLoginClose) isClose = true

          params.toLoginFn(isClose)
          return true
        }
      }
    }
  }
}
