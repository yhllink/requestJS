# yhlRequest

```ts
// 支持自定义属性，必须以$开头
type Params = {
  baseURL?: string // 根路径
  timeout?: number // 超时时间   默认3s
  headers?: false | AxiosRequestConfig['headers'] // 请求头

  // 【1】设置当前请求参数的参数 用于做判断动态设置不同参数
  ___setCurrentParams?: (method: Method, url: string, data: AnyObj, params: Params, axiosConfig: AxiosRequestConfig) => Params

  // 【2】基础数据 //! 仅参数为Object生效
  _baseData?: false | AnyObj
  // 【3】基础数据回调 //! 仅返回为Object生效
  __getBaseDataFn?: false | ((method: Method, url: string, data: AnyObj, params: Params, axiosConfig: AxiosRequestConfig) => Promise<AnyObj>)

  // 【4】请求前回调
  __requestBeforeFn?:
    | false
    | ((
        method: Method,
        url: string,
        data: AnyObj,
        params: Params,
        axiosConfig: AxiosRequestConfig
      ) => AndPromise<void | {
        method?: Method // 可能被修改的请求方法
        url?: string // 可能被修改的请求URL
        data?: AnyObj // 可能被修改的请求数据
        params?: Params // 可能被修改的请求参数
        axiosConfig?: AxiosRequestConfig // 可能被修改的Axios配置
      }>)

  // 【5】设置token方法支持async
  __getTokenFn?:
    | false
    | ((
        method: Method,
        url: string,
        data: AnyObj,
        params: Params,
        axiosConfig: AxiosRequestConfig
      ) => AndPromise<void | {
        data?: AnyObj // 登录参数
        headers?: AxiosRequestConfig['headers'] // 登录header
      }>)

  // 【6】删除参数中值为undefined的参数
  _removeUndefined?: boolean

  // 【7】缓存用户标识
  __getCacheUserTag?: () => string
  // 【8】缓存时间 单位ms
  _isCache?: false | number
  // 【9】缓存存储位置 默认['indexedDB','sessionStorage']//! 必须设置 _isCache 默认缓存
  _cacheDateStore?: ('indexedDB' | 'sessionStorage' | 'localStorage' | 'window')[]
  // 【21】判断是否需要缓存 //! 必须设置 _isCache 默认缓存
  _isCacheFn?: false | ((res: any) => Promise<void | boolean>)

  // 【10】是否开启防抖
  _debounce?: boolean
  // 【11】防抖时间  默认 500ms
  _debounceTime?: number

  // 【12】中断请求的 source
  _source?: CancelTokenSource

  // 【13】请求前最后一次回调 // 加密，验签
  __requestBeforeMiddleFn?:
    | false
    | ((
        method: Method,
        url: string,
        data: AnyObj,
        params: Params,
        axiosConfig: AxiosRequestConfig
      ) => AndPromise<void | {
        method?: Method // 可能被修改的请求方法
        url?: string // 可能被修改的请求URL
        data?: AnyObj // 可能被修改的请求数据
        params?: Params // 可能被修改的请求参数
        axiosConfig?: AxiosRequestConfig // 可能被修改的Axios配置
      }>)

  // 【14】请求随机数时间戳
  _rid?: boolean

  // 【15】post请求表单提交
  _isUpLoad?: boolean

  //! 开始发送请求

  // 【16】是否将相应的Number转成String  默认false
  _Number2String?: boolean

  // 【17】http请求失败提示
  __failHttpToastFn?: false | ((error: AxiosError, method: Method, url: string, data: AnyObj, params: Params, axiosConfig: AxiosRequestConfig) => void)

  // 【18】不需要返回结果
  _noReturn?: boolean

  // 【19】请求后第一次回调-返回数据将作为新的数据向后传递 // 解密，验签
  __requestAfterMiddleFn?:
    | false
    | ((res: ResType, method: Method, url: string, data: AnyObj, params: Params, axiosConfig: AxiosRequestConfig) => AndPromise<void | ResType>)

  // 【20】请求后参数校验，可做相关提示   需要返回检查结果
  __requestReturnCodeCheckFn?:
    | false
    | ((res: any, method: Method, url: string, data: AnyObj, params: Params, axiosConfig: AxiosRequestConfig) => AndPromise<boolean>)

  // 【22】请求后回调
  __requestAfterFn?:
    | false
    | ((
        type: 'success' | 'fail',
        res: any,
        method: Method,
        url: string,
        data: AnyObj,
        params: Params,
        axiosConfig: AxiosRequestConfig
      ) => AndPromise<void | any>)

  // 【23】处理返回数据
  __handleResponseFn?: false | ((res: any) => any)
  // 【24】是否返回全部数据
  _responseAll?: boolean

  [key: `$${string}`]: any
}
```
