// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import fetch from './fetch'
const GIF_URL = '/gif'
const ERROR = {
  NO_URL: 4001,
  IMG_ON: 4000,
  IMG_CATCH: 4002,
  BEACON_FALSE: 4003,
  XHR_ON: 500,
  RESPONSE: 5001,
  TIMEOUT: 5005,
}
var isSupportBeacon = function () {
  if (window.navigator && window.navigator.sendBeacon) {
    return true
  } else {
    return false
  }
}
var NOOP = () => { }
var encodePayload = (obj: any) => {
  var string = ''
  for (var key in obj) {
    if (obj.hasOwnProperty(key) && (typeof obj[key] !== 'undefined')) {
      string += `&${key}=${encodeURIComponent(JSON.stringify(obj[key]))}`
    }
  }
  string = string[0] === '&' ? string.slice(1) : string
  return string
};

var sendByImg = (url: string, data: any, success?: any, fail?: any) => {
  try {
    var splitStringMatch = url.match(/\/v\d\//)
    var splitString = ''
    if (splitStringMatch) {
      splitString = splitStringMatch[0]
    } else {
      splitString = url.indexOf('/v1/') !== -1 ? '/v1/' : '/v2/'
    }
    var urlPrefix = url.split(splitString)[0]
    if (!urlPrefix) {
      fail(url, data, ERROR.NO_URL)
      return
    }
    data.forEach((item) => {
      var str = encodePayload(item);
      var img = new Image(1, 1)
      img.onload = () => {
        img = null
        success && success()
      };
      img.onerror = () => {
        img = null
        fail && fail(url, data, ERROR.IMG_ON)
      }
      img.src = `${urlPrefix}${GIF_URL}?${str}`
    })
  } catch (e) {
    fail && fail(url, data, ERROR.IMG_CATCH, e.message)
  }
}
var request = (url: string, data: any, timeout?: number, withCredentials?: boolean, success?: any, fail?: any, sendBecon?: boolean, encryption?: boolean) => {
  var UA = window.navigator.userAgent
  var browserName = window.navigator.appName
  var isIE89 = browserName.indexOf('Microsoft Internet Explorer') !== -1 &&
    (UA.indexOf('MSIE 8.0') !== -1 || UA.indexOf('MSIE 9.0') !== -1)
  if (isIE89) {
    sendByImg(url, data, success, fail)
  } else {
    if (sendBecon) {
      if (isSupportBeacon()) {
        NOOP()
        var status = window.navigator.sendBeacon(url, JSON.stringify(data))
        if (status) {
          success()
        } else {
          fail(url, data, ERROR.BEACON_FALSE)
        }
        return
      }
      sendByImg(url, data, success, fail)
      return
    }
  }
  fetch(url, data, timeout, withCredentials, success, fail, '', '', encryption)
}

export default request