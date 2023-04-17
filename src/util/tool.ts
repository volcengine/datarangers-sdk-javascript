// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

// @ts-nocheck
export const isObject = (obj: any) =>
  obj != null && Object.prototype.toString.call(obj) == '[object Object]';

export const isFunction = (obj: any) => typeof obj === 'function';

export const isNumber = (obj: any) => typeof obj == 'number' && !isNaN(obj);

export const isString = (obj: any) => typeof obj == 'string';

export const isArray = (obj: any) => Array.isArray(obj);

export const getIndex = (() => {
  var lastEventId = +Date.now() + Number(`${Math.random()}`.slice(2, 8))
  return () => {
    lastEventId += 1
    return lastEventId
  }
})()

/* eslint-disable no-param-reassign */
const decrypto = (str, xor, hex) => {
  if (typeof str !== 'string' || typeof xor !== 'number' || typeof hex !== 'number') {
    return;
  }
  let strCharList = [];
  const resultList = [];
  hex = hex <= 25 ? hex : hex % 25;
  const splitStr = String.fromCharCode(hex + 97);
  strCharList = str.split(splitStr);

  for (let i = 0; i < strCharList.length; i++) {
    let charCode = parseInt(strCharList[i], hex);
    charCode = (charCode * 1) ^ xor;
    const strChar = String.fromCharCode(charCode);
    resultList.push(strChar);
  }
  const resultStr = resultList.join('');
  return resultStr;
}

export const decodeUrl = string => decrypto(string, 64, 25);

export const beforePageUnload = (fn) => {
  var isiOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)
  if (isiOS) {
    window.addEventListener("pagehide", fn, false)
  } else {
    window.addEventListener("beforeunload", fn, false)
  }
}

export const stringify = (origin, path: any = '', query = {}) => {
  let str = origin
  str = str.split('#')[0].split('?')[0]
  if (str[origin.length - 1] === '/') {
    str = str.substr(0, origin.length - 1)
  }
  if (path[0] === '/') {
    // 绝对路径
    str = str.replace(/(https?:\/\/[\w-]+(\.[\w-]+){1,}(:[0-9]{1,5})?)(\/[.\w-]+)*\/?$/, `$1${path}`)
  } else {
    // 相对路径
    str = str.replace(/(https?:\/\/[\w-]+(\.[\w-]+){1,}(:[0-9]{1,5})?(\/[.\w-]+)*?)(\/[.\w-]+)?\/?$/, `$1/${path}`)
  }
  const keys = Object.keys(query)
  const querystr = keys.map(key => `${key}=${query[key]}`).join('&')
  return querystr.length > 0 ? `${str}?${querystr}` : str
}

export const parseURL = (url: string) => {
  const a = document.createElement('a')
  a.href = url
  return a
}
export const parseUrlQuery = (url: string) => {
  const queryObj = {}
  try {
    let queryString = parseURL(url).search
    queryString = queryString.slice(1)
    queryString.split('&').forEach(function (keyValue) {
      let _keyValue = keyValue.split('=')
      let key
      let value
      if (_keyValue.length) {
        key = _keyValue[0]
        value = _keyValue[1]
      }
      try {
        queryObj[key] = decodeURIComponent(typeof value === 'undefined' ? '' : value)
      } catch (e) {
        queryObj[key] = value
      }
    })
  } catch (e) { }
  return queryObj
}
