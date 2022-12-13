// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import Types from './hooktype';
import Storage from '../util/storage'
import fetch from '../util/fetch'
import { parseUrlQuery } from '../util/tool'
import { DebuggerMesssge } from './hooktype'
import localWebId from '../util/local'

export default class Token {
  collect: any
  config: any
  storage: any
  configManager: any
  cacheToken: any = {}
  tokenKey: string
  tokenReady: boolean
  tokenType: string
  enableCookie: boolean = false
  expiresTime: number
  cookieDomain: string
  enable_ttwebid: boolean = false
  enableCustomWebid: boolean = false
  apply(collect: any, config: any) {
    this.collect = collect
    this.config = config
    this.configManager = this.collect.configManager
    this.storage = new Storage(false)
    this.tokenKey = `__tea_cache_tokens_${config.app_id}`
    this.enable_ttwebid = config.enable_ttwebid
    this.enableCustomWebid = config.enable_custom_webid
    this.collect.on(Types.ConfigUuid, (userUniqueId: string) => {
      this.setUuid(userUniqueId);
    })
    this.collect.on(Types.ConfigWebId, (webId: string) => {
      this.setWebId(webId);
    })
    this.enableCookie = config.cross_subdomain
    this.expiresTime = config.cookie_expire || 60 * 60 * 1000 * 24 * 7
    this.cookieDomain = config.cookie_domain || ''
    this.checkStorage()
  }
  checkStorage() {
    if (this.enableCookie) {
      const cookieToken = this.storage.getCookie(this.tokenKey, this.cookieDomain)
      this.cacheToken = cookieToken && typeof cookieToken === 'string' ? JSON.parse(cookieToken) : {}
    } else {
      this.cacheToken = this.storage.getItem(this.tokenKey) || {}
    }
    this.tokenType = this.cacheToken && this.cacheToken._type_ ? this.cacheToken._type_ : 'default'
    if (this.tokenType === 'custom' && !this.enableCustomWebid) {
      this.remoteWebid();
      return;
    } else {
      if (this.enableCustomWebid) {
        this.collect.on(Types.CustomWebId, () => {
          this.tokenReady = true
          this.collect.emit(Types.TokenComplete)
        })
        return;
      }
    }
    if (this.checkEnv()) return;
    if (this.enable_ttwebid) {
      this.completeTtWid(this.cacheToken)
    } else {
      this.check()
    }
  }
  check() {
    if (!this.cacheToken || !this.cacheToken.web_id) {
      if (this.config.disable_webid) {
        this.complete({
          web_id: localWebId(),
          user_unique_id: this.configManager.get('user_unique_id') || localWebId()
        })
      } else {
        this.remoteWebid()
      }
    } else {
      this.complete(this.cacheToken)
    }
  }
  checkEnv() {
    const ua = window.navigator.userAgent
    if (ua.indexOf('miniProgram') !== -1 || ua.indexOf('MiniProgram') !== -1) {
      const urlQueryObj = parseUrlQuery(window.location.href)
      if (urlQueryObj && urlQueryObj['Web_ID']) {
        this.complete({
          web_id: `${urlQueryObj['Web_ID']}`,
          user_unique_id: this.configManager.get('user_unique_id') || `${urlQueryObj['Web_ID']}`
        })
        return true
      }
      return false
    }
    return false
  }

  remoteWebid() {
    const fetchUrl = this.configManager.getUrl('webid')
    const requestBody = {
      app_key: this.config.app_key,
      app_id: this.config.app_id,
      url: location.href,
      user_agent: window.navigator.userAgent,
      referer: document.referrer,
      user_unique_id: '',
    }
    this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, info: 'SDK 发起WEBID请求', logType: 'fetch', level: 'info', time: Date.now(), data: requestBody })
    const localId = localWebId();
    fetch(fetchUrl, requestBody,
      300000, false,
      (data) => {
        let webid
        if (data && data.e === 0) {
          webid = data.web_id
          this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, info: 'WEBID请求成功', logType: 'fetch', level: 'info', time: Date.now(), data: data })
        } else {
          webid = localId
          this.collect.configManager.set({
            localWebId: localId
          })
          this.collect.emit(Types.TokenError)
          this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, info: 'WEBID请求返回值异常', logType: 'fetch', level: 'warn', time: Date.now(), data: data })
          this.collect.logger.warn(`appid: ${this.config.app_id} get webid error, use local webid~`)
        }
        this.complete({
          web_id: this.configManager.get('web_id') || webid,
          user_unique_id: this.configManager.get('user_unique_id') || webid
        })
      },
      () => {
        this.complete({
          web_id: this.configManager.get('web_id') || localId,
          user_unique_id: this.configManager.get('user_unique_id') || localId
        })
        this.collect.configManager.set({
          localWebId: localId
        })
        this.collect.emit(Types.TokenError)
        this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, info: 'WEBID请求网络异常', logType: 'fetch', level: 'error', time: Date.now(), data: null })
        this.collect.logger.warn(`appid: ${this.config.app_id}, get webid error, use local webid~`)
      })
  }
  complete(token: any) {
    const { web_id, user_unique_id } = token
    if (!web_id && !user_unique_id) {
      this.collect.emit(Types.TokenError);
      console.warn('token error')
      return
    }
    token.timestamp = Date.now()
    this.collect.configManager.set({
      web_id,
      user_unique_id
    })
    this.setStorage(token)
    this.tokenReady = true
    this.collect.emit(Types.TokenComplete)
  }
  completeTtWid(token: any) {
    const uuid = token.user_unique_id || ''
    const env_uuid = this.configManager.get('user_unique_id')
    this.configManager.set({
      user_unique_id: env_uuid || uuid
    })
    this.setStorage(token)
    this.tokenReady = true
    this.collect.emit(Types.TokenComplete)
  }
  setUuid(uuid: string) {
    if (!uuid || ['null', 'undefined', 'Null', 'None'].indexOf(uuid) !== -1) {
      this.clearUuid()
    } else {
      let newUuid = String(uuid)
      const env_uuid = this.configManager.get('user_unique_id')
      const cache_uuid = this.cacheToken && this.cacheToken.user_unique_id
      if (newUuid === env_uuid && newUuid === cache_uuid) return;
      this.configManager.set({
        user_unique_id: newUuid
      })
      if (this.cacheToken) {
        this.cacheToken.user_unique_id = newUuid
      } else {
        this.cacheToken = {}
        this.cacheToken.user_unique_id = newUuid
      }
      this.cacheToken.timestamp = Date.now()
      this.setStorage(this.cacheToken)
      this.collect.emit(Types.TokenChange, 'uuid')
      this.collect.emit(Types.SessionReset)
    }
  }
  clearUuid() {
    if (this.config.enable_ttwebid) return;
    if (!this.configManager.get('web_id')) return;
    this.configManager.set({
      user_unique_id: this.configManager.get('web_id')
    })
    if (this.cacheToken && this.cacheToken.web_id) {
      this.cacheToken.user_unique_id = this.cacheToken.web_id
      this.cacheToken.timestamp = Date.now()
      this.setStorage(this.cacheToken)
    }
    this.collect.emit(Types.TokenReset)
  }
  setWebId(web_id: string) {
    if (!web_id || this.config.enable_ttwebid) return;
    if (this.cacheToken && this.cacheToken.web_id) {
      if (this.cacheToken.web_id !== web_id) {
        this.cacheToken.user_unique_id = this.cacheToken.web_id === this.cacheToken.user_unique_id ? web_id : this.cacheToken.user_unique_id
        this.cacheToken.web_id = web_id
      }
    } else {
      this.cacheToken = {}
      this.cacheToken.web_id = web_id
      this.cacheToken.user_unique_id = web_id
    }
    this.cacheToken.timestamp = Date.now()
    const env_webid = this.configManager.get('web_id')
    const env_uuid = this.configManager.get('user_unique_id')
    if (!env_uuid || (env_uuid === env_webid)) {
      this.configManager.set({
        user_unique_id: web_id
      })
      this.collect.emit(Types.TokenChange, 'uuid')
    }
    if (env_webid !== web_id) {
      this.configManager.set({
        web_id
      })
      this.collect.emit(Types.TokenChange, 'webid')
    }
    this.setStorage(this.cacheToken)

  }
  setStorage(token: any) {
    token._type_ = this.enableCustomWebid ? 'custom' : 'default'
    const _key = 'diss'.split('').reverse().join('')
    delete token[_key]
    if (this.enableCookie || this.enable_ttwebid) {
      this.storage.setCookie(this.tokenKey, token, this.expiresTime, this.cookieDomain)
    } else {
      this.storage.setItem(this.tokenKey, token)
    }
    this.cacheToken = token
  }
  getReady() {
    return this.tokenReady;
  }
  getTobId() {
    const tobUrl = this.configManager.getUrl('tobid');
    return new Promise(resolve => {
      fetch(tobUrl,
        {
          app_id: this.config.app_id,
          user_unique_id: this.configManager.get('user_unique_id'),
          web_id: this.configManager.get('web_id'),
          user_unique_id_type: this.configManager.get('user_unique_id_type')
        },
        30000,
        this.enable_ttwebid,
        (data) => {
          if (data && data.e === 0) {
            resolve(data.tobid)
          } else {
            resolve('')
          }
        },
        () => {
          resolve('')
        }
      )
    })
  }
}