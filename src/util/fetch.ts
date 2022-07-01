// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

const ERROR = {
  NO_URL: 4001,
  IMG_ON: 4000,
  IMG_CATCH: 4002,
  BEACON_FALSE: 4003,
  XHR_ON: 500,
  RESPONSE: 5001,
  TIMEOUT: 5005,
}
export default function fetch(url:string, data:any, timeout?: number, withCredentials?: boolean, success?:any, fail?:any, app_key?:string, method?:string): void {
  try {
    var xhr = new XMLHttpRequest()
    var _method = method || 'POST'
    xhr.open(_method, `${url}`, true)
    xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8')
    if (app_key) {
      xhr.setRequestHeader('X-MCS-AppKey', `${app_key}`)
    }
    if (withCredentials) {
      xhr.withCredentials = true
    }
    if (timeout) {
      xhr.timeout = timeout
      xhr.ontimeout = () => {
        fail && fail(data, ERROR.TIMEOUT)
      }
    }
    xhr.onload = () => {
      if (success) {
        var res = null
        if (xhr.responseText) {
          try {
            res = JSON.parse(xhr.responseText)
          } catch(e) {
            res = {}
          }
          success(res, data)
        }
      }
    }
    xhr.onerror = () => {
      xhr.abort()
      fail && fail(data, ERROR.XHR_ON)
    }
    xhr.send(JSON.stringify(data))
  } catch (e) {}
}
