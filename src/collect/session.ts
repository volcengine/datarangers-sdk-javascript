// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import Types from './hooktype';
import StorageManager from '../plugin/storage';

interface SessionCacheType {
  sessionId: string,
  timestamp: number
}

export const sessionId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
  const r = (Math.random() * 16) | 0;
  const v = c === 'x' ? r : (r & 0x3) | 0x8;
  return v.toString(16);
})

export default class Session {
  sessionKey: string
  storage: any
  sessionExp: any
  expireTime: number
  disableSession: boolean
  collect: any
  apply(collect: any, config: any) {
    this.collect = collect
    this.storage = new StorageManager()
    this.sessionKey = `__tea_session_id_${config.app_id}`
    this.expireTime = config.expireTime || 30 * 60 * 1000
    this.disableSession = config.disable_session
    if (this.disableSession) return
    this.setSessionId()
    this.collect.on(Types.SessionReset, () => {
      this.resetSessionId()
    })
    this.collect.on(Types.SessionResetTime, () => {
      this.updateSessionIdTime()
    })
  }
  updateSessionIdTime() {
    let sessionCache: SessionCacheType = this.storage.getSessionItem(this.sessionKey)
    if (sessionCache && sessionCache.sessionId) {
      const oldTime = sessionCache.timestamp
      if ((Date.now() - oldTime) > this.expireTime) {
        // 30分钟超时
        sessionCache = {
          sessionId: sessionId(),
          timestamp: Date.now()
        }
      } else {
        sessionCache.timestamp = Date.now()
      }
      this.storage.setSessionItem(this.sessionKey, sessionCache)
      this.resetExpTime()
    }
  }
  setSessionId() {
    let sessionCache: SessionCacheType = this.storage.getSessionItem(this.sessionKey)
    if (sessionCache && sessionCache.sessionId) {
      sessionCache.timestamp = Date.now()
    } else {
      sessionCache = {
        sessionId: sessionId(),
        timestamp: Date.now()
      }
    }
    this.storage.setSessionItem(this.sessionKey, sessionCache)
    this.sessionExp = setInterval(() => {
      this.checkEXp()
    }, this.expireTime)
  }
  getSessionId() {
    const sessionCache: SessionCacheType = this.storage.getSessionItem(this.sessionKey)
    if (this.disableSession) {
      return ''
    }
    if (sessionCache && sessionCache.sessionId) {
      return sessionCache.sessionId
    } else {
      return ''
    }
  }
  resetExpTime() {
    if (this.sessionExp) {
      clearInterval(this.sessionExp)
      this.sessionExp = setInterval(() => {
        this.checkEXp()
      }, this.expireTime)
    }
  }
  resetSessionId() {
    const sessionCache = {
      sessionId: sessionId(),
      timestamp: Date.now()
    }
    this.storage.setItem(this.sessionKey, sessionCache)
  }
  checkEXp() {
    let sessionCache: SessionCacheType = this.storage.getSessionItem(this.sessionKey)
    if (sessionCache && sessionCache.sessionId) {
      const oldTime = Date.now() - sessionCache.timestamp
      if (oldTime + 30 >= this.expireTime) {
        // 30分钟超时
        sessionCache = {
          sessionId: sessionId(),
          timestamp: Date.now()
        }
        this.storage.setSessionItem(this.sessionKey, sessionCache)
      }
    }
  }
}