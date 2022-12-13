// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import { isSupVisChange, beforePageUnload, isObject } from '../../util/tool'
interface Option {
  aliveName?: string,
  params?: any
}
export default class Alive {
  collect: any
  config: any
  pageStartTime: number
  maxDuration: number = 12 * 60 * 60 * 1000
  sessionStartTime: number
  timerHandler: any
  url_path: string
  url: string
  title: string
  set_path: string
  set_url: string
  set_title: string
  aliveDTime: number = 60 * 1000
  aliveName: string
  disableCallback: any
  options: Option = { aliveName: 'predefine_page_alive', params: {} }
  constructor(collect: any, config: any) {
    this.collect = collect
    this.config = config
    this.pageStartTime = Date.now()
    this.sessionStartTime = this.pageStartTime
    this.timerHandler = null
    if (isObject(config.enable_stay_duration)) {
      this.options = Object.assign(this.options, config.enable_stay_duration)
    }
  }
  setParams(url_path: string, title: string, url: string) {
    this.set_path = url_path
    this.set_url = url
    this.set_title = title
  }
  enable(url_path: string, title: string, url: string) {
    this.url_path = url_path
    this.url = url
    this.title = title
    this.disableCallback = this.enablePageAlive()
  }

  disable() {
    this.disableCallback()
    this.pageStartTime = Date.now()
  }

  sendEvent(leave: boolean, limited = false) {
    const duration = limited ? this.aliveDTime : Date.now() - this.sessionStartTime
    if (duration < 0 || duration > this.aliveDTime || (Date.now() - this.pageStartTime > this.maxDuration)) {
      return
    }
    this.collect.beconEvent(this.options.aliveName, {
      url_path: this.getParams('url_path'),
      title: this.getParams('title'),
      url: this.getParams('url'),
      duration: duration,
      is_support_visibility_change: isSupVisChange(),
      startTime: this.sessionStartTime,
      hidden: document.visibilityState,
      leave,
      ...this.options.params
    })
    this.sessionStartTime = Date.now()
  }

  getParams(type: string) {
    switch (type) {
      case 'url_path':
        return this.set_path || this.url_path || location.pathname
      case 'title':
        return this.set_title || this.title || document.title || location.pathname
      case 'url':
        return this.set_url || this.url || location.href
    }
  }
  setUpTimer() {
    if (this.timerHandler) clearInterval(this.timerHandler)
    return setInterval(() => {
      if (Date.now() - this.sessionStartTime > this.aliveDTime) {
        this.sendEvent(false, true)
      }
    }, 1000)
  }

  visibilitychange() {
    if (document.visibilityState === 'hidden') {
      if (this.timerHandler) {
        clearInterval(this.timerHandler)
        this.sendEvent(false)
      }
    } else if (document.visibilityState === 'visible') {
      // 重置时间
      this.sessionStartTime = Date.now()
      this.timerHandler = this.setUpTimer()
    }
  }

  beforeunload() {
    if (!document.hidden) {
      this.sendEvent(true)
    }
  }
  enablePageAlive() {
    this.timerHandler = this.setUpTimer()
    const change = this.visibilitychange.bind(this)
    const before = this.beforeunload.bind(this)
    document.addEventListener('visibilitychange', change)
    beforePageUnload(before)
    return () => {
      this.beforeunload()
      document.removeEventListener('visibilitychange', change)
      window.removeEventListener('beforeunload', before)
      window.removeEventListener('pagehide', before)
    }
  }
}