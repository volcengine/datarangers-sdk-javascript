
// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.
import Cookies from 'js-cookie';
class Memory {
  cache: any
  constructor() {
    this.cache = {}
  }
  setItem(cacheKey, data) {
    this.cache[cacheKey] = data
  }
  getItem(cacheKey) {
    return this.cache[cacheKey]
  }
  removeItem(cacheKey) {
    this.cache[cacheKey] = undefined
  }
  getCookie(name) {
    this.getItem(name)
  }
  setCookie(key, value) {
    this.setItem(key, value)
  }
}

function isSupportLS() {
  try {
    localStorage.setItem('_ranger-test-key', 'hi')
    localStorage.getItem('_ranger-test-key')
    localStorage.removeItem('_ranger-test-key')
    return true
  } catch (e) {
    return false
  }
}
function isSupportSession() {
  try {
    sessionStorage.setItem('_ranger-test-key', 'hi')
    sessionStorage.getItem('_ranger-test-key')
    sessionStorage.removeItem('_ranger-test-key')
    return true
  } catch (e) {
    return false
  }
}

const local = {
  getItem(key) {
    try {
      var value = localStorage.getItem(key)
      let ret = value
      try {
        if (value && typeof value === 'string') {
          ret = JSON.parse(value)
        }
      } catch (e) {}

      return ret || {}
    } catch (e) { }
    return {}
  },
  setItem(key, value) {
    try {
      var stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      localStorage.setItem(key, stringValue)
    } catch (e) {}
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key)
    } catch (e) {}
  },
  getCookie(name: string, domain?: string){
    try {
      var _matches = Cookies.get(name, { domain: domain || document.domain })
      return _matches
    } catch (e) {
      return ''
    }
  },
  setCookie(name, value, expiresTime, domain) {
    try {
      const _domain = domain || document.domain
      const timestamp = +new Date();
      const furureTimestamp = timestamp + expiresTime; // 3年
      Cookies.set(name, value, {
        expires: new Date(furureTimestamp),
        path: '/',
        domain: _domain
      })
    } catch (e) {
    }
  },
  isSupportLS: isSupportLS(),
}
const session = {
  getItem(key) {
    try {
      var value = sessionStorage.getItem(key)
      let ret = value
      try {
        if (value && typeof value === 'string') {
          ret = JSON.parse(value)
        }
      } catch (e) {}

      return ret || {}
    } catch (e) { }
    return {}
  },
  setItem(key, value) {
    try {
      var stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      sessionStorage.setItem(key, stringValue)
    } catch (e) {}
  },
  removeItem(key) {
    try {
      sessionStorage.removeItem(key)
    } catch (e) {}
  },
  getCookie(name) {
    this.getItem(name)
  },
  setCookie(key, value) {
    this.setItem(key, value)
  },
  isSupportSession: isSupportSession(),
}

export default class Storage {
  _storage: any
  constructor(isCache, type?: string) {
    if (type && type === 'session') {
      this._storage = session
    } else {
      this._storage = !isCache && local.isSupportLS ? local : new Memory()
    }
  }
  getItem(key) {
    return this._storage.getItem(key)
  }
  setItem(key, value) {
    this._storage.setItem(key, value)
  }
  getCookie(name: string, domain?: string) {
    return this._storage.getCookie(name, domain)
  }
  setCookie(key, value, expiresTime, domain) {
    this._storage.setCookie(key, value, expiresTime, domain)
  }
  removeItem(key) {
    this._storage.removeItem(key)
  }
}