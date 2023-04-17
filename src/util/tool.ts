// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

// @ts-nocheck
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

export const encodeBase64 = (string) => {
  if (window.btoa) {
    return window.btoa(encodeURIComponent(string));
  }
  return encodeURIComponent(string);
}

export const decodeBase64 = (string) => {
  if (window.atob) {
    return decodeURIComponent(window.atob(string));
  }
  return decodeURIComponent(string);
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

export const getIframeUrl = function () {
  try {
    var name = JSON.parse(atob(window.name))
    if (name) {
      return name
    } else {
      return undefined
    }
  } catch (e) {
    return undefined
  }
}

export const splitArrayByFilter = (list = [], valueFn = item => item, threshold = 20) => {
  const result = [];
  let index = 0;
  let prev;
  list.forEach((item) => {
    const cur = valueFn(item);
    if (typeof prev === 'undefined') {
      prev = cur;
    } else if (cur !== prev || result[index].length >= threshold) {
      index += 1;
      prev = cur;
    }
    result[index] = result[index] || [];
    result[index].push(item);
  });

  return result;
}

export const loadScript = (src, success, error) => {
  const script = document.createElement('script');
  script.src = src;

  script.onerror = function () {
    error(src);
  };

  script.onload = function () {
    success();
  };

  document.getElementsByTagName('head')[0].appendChild(script);
}

export const isSupVisChange = () => {
  let flag = 0;
  ['hidden', 'msHidden', 'webkitHidden'].forEach(hidden => {
    if (document[hidden] !== undefined) {
      flag = 1
    }
  })
  return flag
}

export const selfAdjust = (cb = () => undefined, interval = 1000) => {
  let expected = Date.now() + interval
  let timerHander: number
  function step() {
    const dt = Date.now() - expected
    cb()
    expected += interval
    timerHander = window.setTimeout(step, Math.max(0, interval - dt))
  }
  timerHander = window.setTimeout(step, interval)
  return () => {
    window.clearTimeout(timerHander)
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

export const hashCode = (str: string): number => {
  str += '';
  let h = 0;
  let off = 0;
  const len = str.length;

  for (let i = 0; i < len; i++) {
    h = 31 * h + str.charCodeAt(off++);
    if (h > 0x7fffffffffff || h < -0x800000000000) {
      h &= 0xffffffffffff;
    }
  }
  if (h < 0) {
    h += 0x7ffffffffffff;
  }
  return h;
}


function leftPad(input, num) {
  if (input.length >= num) return input

  return (new Array(num - input.length + 1)).join('0') + input
}

export const hexToArray = (hexStr) => {
  const words = []
  let hexStrLength = hexStr.length

  if (hexStrLength % 2 !== 0) {
    hexStr = leftPad(hexStr, hexStrLength + 1)
  }

  hexStrLength = hexStr.length

  for (let i = 0; i < hexStrLength; i += 2) {
    words.push(parseInt(hexStr.substr(i, 2), 16))
  }
  return words
}

export const hexToBtyes = (hexStr) => {
  for (var bytes = [], c = 0; c < hexStr.length; c += 2)
    bytes.push(parseInt(hexStr.substr(c, 2), 16));
  return bytes;
}
var base64EncodeChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
var base64encode = function (e) {
  var r, a, c, h, o, t;
  for (c = e.length, a = 0, r = ''; a < c;) {
    if (h = 255 & e.charCodeAt(a++), a == c) {
      r += base64EncodeChars.charAt(h >> 2),
        r += base64EncodeChars.charAt((3 & h) << 4),
        r += '==';
      break
    }
    if (o = e.charCodeAt(a++), a == c) {
      r += base64EncodeChars.charAt(h >> 2),
        r += base64EncodeChars.charAt((3 & h) << 4 | (240 & o) >> 4),
        r += base64EncodeChars.charAt((15 & o) << 2),
        r += '=';
      break
    }
    t = e.charCodeAt(a++),
      r += base64EncodeChars.charAt(h >> 2),
      r += base64EncodeChars.charAt((3 & h) << 4 | (240 & o) >> 4),
      r += base64EncodeChars.charAt((15 & o) << 2 | (192 & t) >> 6),
      r += base64EncodeChars.charAt(63 & t)
  }
  return r
}
export const hextobase = (str) => {
  return base64encode(String.fromCharCode.apply(null, str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));

}
