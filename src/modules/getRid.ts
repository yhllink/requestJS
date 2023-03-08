import { prefixInteger } from 'yhl-utils'

// 生成随机请求id
export default function getRid() {
  const date = new Date()
  // 时分秒
  const HH = prefixInteger(date.getHours(), 2)
  const mm = prefixInteger(date.getMinutes(), 2)
  const ss = prefixInteger(date.getSeconds(), 2)

  return parseInt(HH + mm + ss).toString(32)
}
