// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import fetch from './fetch'
const ERROR = {
  NO_URL: 4001,
  IMG_ON: 4000,
  IMG_CATCH: 4002,
  BEACON_FALSE: 4003,
  XHR_ON: 500,
  RESPONSE: 5001,
  TIMEOUT: 5005,
}
var request = (url: string, data: any, timeout?: number, withCredentials?: boolean, success?: any, fail?: any, sendBecon?: boolean, encryption?: boolean) => {
  if (sendBecon && window.navigator && window.navigator.sendBeacon) {
    var status = window.navigator.sendBeacon(url, JSON.stringify(data))
    if (status) {
      success()
    } else {
      fail(url, data, ERROR.BEACON_FALSE)
    }
    return
  }
  fetch(url, data, timeout, withCredentials, success, fail, '', '', encryption)
}

export default request