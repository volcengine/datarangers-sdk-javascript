// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

// 存储管理器
import Cookies from '../../util/cookie';

type Record = {
  [key: string]: any
}

/**
 * cacheStorage
 */
export class Memory {
  cache: Record
  constructor() {
    this.cache = {};
  }
  setItem(cacheKey, data) {
    this.cache[cacheKey] = data;
  }
  getItem(cacheKey) {
    return this.cache[cacheKey];
  }
  removeItem(cacheKey) {
    this.cache[cacheKey] = undefined;
  }
}

/**
 * localStorage
 */
export class Local {
  protected support: boolean
  constructor() {
    this.support = this.isSupportLS();
  }
  isSupportLS() {
    try {
      localStorage.setItem('_applogtest-test-key', 'hi');
      localStorage.getItem('_applogtest-test-key');
      localStorage.removeItem('_applogtest-test-key');
      return true
    } catch (e) {
      return false
    }
  }
  getItem(key) {
    try {
      var value = localStorage.getItem(key);
      let ret = value
      try {
        if (value && typeof value === 'string') {
          ret = JSON.parse(value)
        }
      } catch (e) { }

      return ret || {}
    } catch (e) { }
    return {}
  }
  setItem(key, value) {
    try {
      var stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      localStorage.setItem(key, stringValue)
    } catch (e) { }
  }
  removeItem(key) {
    try {
      localStorage.removeItem(key)
    } catch (e) { }
  }
}

/**
 * sessionStorage
 */
export class Session {
  protected support: boolean
  constructor() {
    this.support = this.isSupportSession();
  }
  isSupportSession() {
    try {
      sessionStorage.setItem('_applogtest-test-key', 'hi')
      sessionStorage.getItem('_applogtest-test-key')
      sessionStorage.removeItem('_applogtest-test-key')
      return true
    } catch (e) {
      return false
    }
  }
  getItem(key) {
    try {
      var value = sessionStorage.getItem(key)
      let ret = value
      try {
        if (value && typeof value === 'string') {
          ret = JSON.parse(value)
        }
      } catch (e) { }

      return ret || {}
    } catch (e) { }
    return {}
  }
  setItem(key, value) {
    try {
      var stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      sessionStorage.setItem(key, stringValue)
    } catch (e) { }
  }
  removeItem(key) {
    try {
      sessionStorage.removeItem(key)
    } catch (e) { }
  }
}


export default class StorageManager {
  private local: Local
  private session: Session
  private cache: Memory
  private defaultExpireTime: number
  constructor() {
    this.defaultExpireTime = 7 * 1000 * 60 * 60 * 24;
    this.local = new Local()
    this.session = new Session()
    this.cache = new Memory()
  }
  getLocalItem(key: string) {
    return this.local.getItem(key)
  }
  setLocalItem(key: string, value) {
    this.local.setItem(key, value)
  }
  removeLocalItem(key) {
    this.local.removeItem(key)
  }
  getSessionItem(key: string) {
    return this.session.getItem(key)
  }
  setSessionItem(key: string, value) {
    this.session.setItem(key, value)
  }
  removeSessionItem(key: string) {
    this.session.removeItem(key)
  }
  getCacheItem(key: string) {
    return this.cache.getItem(key)
  }
  setCacheItem(key: string, value) {
    this.cache.setItem(key, value)
  }
  removeCacheItem(key: string) {
    this.cache.removeItem(key)
  }
  getCookie(key: string, domain?: string) {
    try {
      // const _matches = Cookies.get(name, { domain: domain || document.domain })
      const _matches = Cookies.get(key)
      return _matches
    } catch (e) {
      return ''
    }
  }
  setCookie(key: string, value: any, expiresTime: number = this.defaultExpireTime, domain: string) {
    try {
      const _domain = domain || document.domain
      const timestamp = +new Date();
      const furureTimestamp = timestamp + expiresTime;
      Cookies.set(key, value, {
        expires: new Date(furureTimestamp),
        path: '/',
        domain: _domain
      })
    } catch (e) {
    }
  }
  removeCookie(key: string, domain?: string) {
    try {
      Cookies.remove(key, {
        path: '/',
        domain: domain || ''
      })
    } catch (e) { }
  }
}
