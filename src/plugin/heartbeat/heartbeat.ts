// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import { selfAdjust } from '../../util/tool'
export default class HeartBeat {
  sessionInterval: number
  isSessionhasEvent: boolean
  startTime: number
  lastTime: number
  collect: any
  clearIntervalFunc: () => void
  apply(collect: any, config: any) {
    this.collect = collect
    if (config.disable_heartbeat) return
    this.sessionInterval = 60 * 1000
    this.startTime = 0
    this.lastTime = 0
    this.setInterval()
    const { Types } = this.collect
    this.collect.on(Types.SessionReset, () => {
      this.process()
    })
  }

  endCurrentSession() {
    this.collect.event('_be_active', {
      start_time: this.startTime,
      end_time: this.lastTime,
      url: window.location.href,
      referrer: window.document.referrer,
      title: document.title || location.pathname,
    })
    this.isSessionhasEvent = false
    this.startTime = 0
  }

  setInterval = () => {
    this.clearIntervalFunc = selfAdjust(() => {
      if (this.isSessionhasEvent) {
        this.endCurrentSession()
      }
    }, this.sessionInterval)
  }

  clearInterval = () => {
    this.clearIntervalFunc && this.clearIntervalFunc()
  }

  process() {
    if (!this.isSessionhasEvent) {
      this.isSessionhasEvent = true
      this.startTime = +new Date()
    }
    const preLastTime = this.lastTime || +new Date()
    this.lastTime = +new Date()
    if (this.lastTime - preLastTime > this.sessionInterval) {
      this.clearInterval()
      this.endCurrentSession()
      this.setInterval()
    }
  }
}