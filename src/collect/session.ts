import Types from './hooktype'
import Storage from '../util/storage'

interface SessionCacheType {
  sessionId: string,
  timestamp: number
}

const sessionId = () =>  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
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
    this.storage = new Storage(false, 'session')
    this.sessionKey =  `__tea_session_id_${config.app_id}`
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
    var sessionCache: SessionCacheType = this.storage.getItem(this.sessionKey)
    if (sessionCache && sessionCache.sessionId) {
      var _oldTime = sessionCache.timestamp
      if ((Date.now() - _oldTime) > this.expireTime) {
        // 30分钟超时
        sessionCache = {
          sessionId: sessionId(),
          timestamp: Date.now()
        }
      } else {
        sessionCache.timestamp = Date.now()
      }
      this.storage.setItem(this.sessionKey, sessionCache)
      this.resetExpTime()
    }
  }
  setSessionId() {
    var sessionCache: SessionCacheType = this.storage.getItem(this.sessionKey)
    if (sessionCache && sessionCache.sessionId) {
      sessionCache.timestamp = Date.now()
    } else {
      sessionCache = {
        sessionId: sessionId(),
        timestamp: Date.now()
      }
    }
    this.storage.setItem(this.sessionKey, sessionCache)
    this.sessionExp = setInterval(()=>{
      this.checkEXp()
    }, this.expireTime)
  }
  getSessionId() {
    var sessionCache: SessionCacheType = this.storage.getItem(this.sessionKey)
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
      this.sessionExp = setInterval(()=>{
        this.checkEXp()
      }, this.expireTime)
    }
  }
  resetSessionId() {
    var sessionCache = {
      sessionId: sessionId(),
      timestamp: Date.now()
    }
    this.storage.setItem(this.sessionKey, sessionCache)
  }
  checkEXp() {
    var sessionCache: SessionCacheType = this.storage.getItem(this.sessionKey)
    if (sessionCache && sessionCache.sessionId) {
      var _oldTime = Date.now() - sessionCache.timestamp
      if (_oldTime + 30 >= this.expireTime) {
        // 30分钟超时
        sessionCache = {
          sessionId: sessionId(),
          timestamp: Date.now()
        }
        this.storage.setItem(this.sessionKey, sessionCache)
      }
    }
  }
}