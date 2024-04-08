# yhlRequest

```ts
// 支持自定义属性，必须以$开头
type ParamsType = {
  baseURL?: string // 根路径
  timeout?: number // 超时时间   默认3s
  headers?: false | AxiosRequestConfig['headers'] // 请求头

  _source?: CancelTokenSource // 中断请求的 source

  _baseData?: false | AnyObj // 基础数据 //! 仅参数为Object生效
  __getBaseDataFn?: false | ((method: Method, url: string) => AnyObj) // 基础数据回调 //! 优先于_baseData   仅参数为Object生效

  _removeUndefined?: boolean // 删除参数中值为undefined的参数

  // 设置token方法支持async
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
        // loginToken?: string // 登录标识token  切换用户后，清除其他用户缓存
      }>)

  __requestBeforeFn?:
    | false
    | ((
        method: Method,
        url: string,
        data: AnyObj,
        params: Params,
        axiosConfig: AxiosRequestConfig
      ) => AndPromise<void | {
        method?: Method
        url?: string
        data?: AnyObj
        params?: Params
        axiosConfig?: AxiosRequestConfig
      }>) // 请求前回调

  __requestBeforeMiddleFn?:
    | false
    | ((
        method: Method,
        url: string,
        data: AnyObj,
        params: Params,
        axiosConfig: AxiosRequestConfig
      ) => AndPromise<void | {
        method?: Method
        url?: string
        data?: AnyObj
        params?: Params
        axiosConfig?: AxiosRequestConfig
      }>) // 请求前最后一次回调 // 加密，验签

  _isCache?: false | number // 缓存时间 //! 必须设置 __requestReturnCodeCheckFn  并且校验结果为 true
  _cacheDateStore?: ('indexedDB' | 'sessionStorage' | 'localStorage')[] // 缓存存储位置 默认['indexedDB','sessionStorage']
  _isCacheFn?: false | ((res: any) => Promise<void | boolean>) // 判断是否需要缓存 //! 必须设置 _isCache 默认缓存

  _debounce?: boolean // 是否开启防抖
  _debounceTime?: number // 防抖时间  默认 500ms

  _rid?: boolean // 请求随机数时间戳

  _isUpLoad?: boolean // post请求表单提交

  __handleResponseFn?: false | ((res: any) => any) // 处理返回数据 //! 优先级高于_responseAll
  _responseAll?: boolean // 是否返回全部数据

  _noReturn?: boolean // 不需要返回结果

  __failHttpToastFn?: false | ((error: AxiosError, method: Method, url: string, data: AnyObj, params: Params, axiosConfig: AxiosRequestConfig) => void) // http请求失败提示
  __failToastFn?: false | ((res: any) => void) // 请求失败提示

  __requestAfterMiddleFn?: false | ((res: any) => void | any) // 请求后第一次回调-返回数据将作为新的数据向后传递 // 解密，验签

  _responseLogin?: boolean // 接口返回 登录是否跳转
  __checkLoginFn?: false | ((res: any) => AndPromise<void | { login?: boolean; close?: boolean }>) // 接口返回检查是否是登录态
  __toLoginToast?: false | ((close: boolean) => void) // 当前需要登录态 跳转登录页提示
  __toLoginFn?: false | ((close: boolean) => void) // 当前需要登录态 跳转登录页方法

  __requestReturnCodeCheckFn?:
    | false
    | ((res: any, method: Method, url: string, data: AnyObj, params: Params, axiosConfig: AxiosRequestConfig) => AndPromise<boolean>) // 请求后参数校验，可做相关提示   需要返回检查结果

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
      ) => AndPromise<void | any>) // 请求后回调

  [key: string]: any
}
```