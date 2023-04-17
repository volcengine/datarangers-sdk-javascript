// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import Types from './hooktype';
import Storage from '../util/storage'
import fetch from '../util/fetch'
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
  apply(collect: any, config: any) {
    this.collect = collect
    this.config = config
    this.configManager = this.collect.configManager
    this.storage = new Storage(false)
    this.tokenKey = `__tea_cache_tokens_${config.app_id}`
    this.collect.on(Types.ConfigUuid, (userUniqueId: string) => {
      this.setUuid(userUniqueId);
    })
    this.checkStorage()
  }
  checkStorage() {
    this.cacheToken = this.storage.getItem(this.tokenKey) || {}
    this.check()
  }
  check() {
    if (!this.cacheToken || !this.cacheToken.web_id) {
      this.remoteWebid()
    } else {
      this.complete(this.cacheToken)
    }
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
    const localId = localWebId();
    fetch(fetchUrl, requestBody,
      300000, false,
      (data) => {
        let webid
        if (data && data.e === 0) {
          webid = data.web_id
        } else {
          webid = localId
          this.collect.configManager.set({
            localWebId: localId
          })
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
        this.collect.logger.warn(`appid: ${this.config.app_id}, get webid error, use local webid~`)
      })
  }
  complete(token: any) {
    const { web_id, user_unique_id } = token
    if (!web_id && !user_unique_id) {
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

  setStorage(token: any) {
    token._type_ = 'default'
    this.storage.setItem(this.tokenKey, token)
    this.cacheToken = token
  }
  getReady() {
    return this.tokenReady;
  }
}