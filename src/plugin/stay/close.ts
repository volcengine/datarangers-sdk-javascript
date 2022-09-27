// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.
import { isSupVisChange, beforePageUnload, isObject } from '../../util/tool'

interface Option {
  closeName?: string,
  params?: any
}
export default class Close {
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
  options: Option = { closeName: 'predefine_page_close', params : {}}
  activeStartTime:number
  activeEndTime: any
  activeTimes: number
  totalTime: number
  disableCallback: any
  constructor(collect: any, config: any) {
    this.collect = collect
    this.config = config
    this.maxDuration = config.max_duration || config.maxDuration || 24 * 60 * 60 * 1000
    this.pageStartTime = Date.now()
    if (isObject(config.enable_stay_duration)) {
      this.options = Object.assign(this.options, config.enable_stay_duration)
    }
    this.resetData()
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
    this.disableCallback = this.enablePageClose()
  }

  disable() {
    this.disableCallback()
  }

  resetData() {
    this.activeStartTime = this.activeStartTime === undefined ? this.pageStartTime : Date.now()
    this.activeEndTime = undefined
    this.activeTimes = 1 
    this.totalTime = 0 
  }

  sendEventPageClose() {
    const total_duration = Date.now() - this.pageStartTime
    if (this.totalTime < 0 || total_duration < 0) return
    // 超过24小时的时长没有统计意义
    if (this.totalTime >= this.maxDuration) return
    this.collect.beconEvent(this.options.closeName, {
      url_path: this.getParams('url_path'),
      title: this.getParams('title'),
      url: this.getParams('url'),
      active_times: this.activeTimes,
      duration: this.totalTime,
      total_duration: total_duration, 
      is_support_visibility_change: isSupVisChange(),
      ...this.options.params
    })

    this.pageStartTime = Date.now()
    this.resetData()
  }

  getParams(type: string) {
    switch(type) {
      case 'url_path':
        return this.set_path || this.url_path || location.pathname
      case 'title':
        return this.set_title || this.title || document.title || location.pathname
      case 'url':
        return this.set_url || this.url || location.href
    }
  }

  visibilitychange = () => {
    if (document.visibilityState === 'hidden') {
      this.activeEndTime = Date.now()

    } else if (document.visibilityState === 'visible') {
      if (this.activeEndTime) {
        this.totalTime += (this.activeEndTime - this.activeStartTime)
        this.activeTimes += 1
      }
      this.activeEndTime = undefined
      this.activeStartTime = Date.now()
    }
  };

  beforeunload = () => {
    this.totalTime += ((this.activeEndTime || Date.now()) - this.activeStartTime)
    if (this.config.autotrack) {
      const durationKey = '_tea_cache_duration'
      try {
        var session = window.sessionStorage
        session.setItem(durationKey, JSON.stringify({
          duration: this.totalTime,
          page_title: document.title || location.pathname
        }))
      } catch (e) {}
    }

    this.sendEventPageClose()
  };

  enablePageClose() {
    const change = this.visibilitychange.bind(this)
    const before = this.beforeunload.bind(this)
    document.addEventListener('visibilitychange', change)
    beforePageUnload(before)
    return () => {
      this.beforeunload()
      document.removeEventListener('visibilitychange', change)
      window.removeEventListener('beforeunload', before)
      window.removeEventListener('pagehide', before)
    };
  }
}