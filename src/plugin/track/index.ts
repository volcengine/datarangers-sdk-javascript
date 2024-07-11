// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import Listener from './listener'
import Config, { defaultConfig } from './config'
import EventHandle from './event'
import Request from './request'
import { OptionsType, EventInfo } from './type'
import readyToLoadEditor from './load'
import Exposure from './exposure'
// import ScrollSlide from './scroll/scroll'
import { isBoolean } from '../../util/tool'

const defaultOpt = {
  hashTag: false,
  impr: false,
}
export default class AutoTrack {
  engine: any
  Listener: Listener
  EventHandle: EventHandle
  Request: Request
  Exposure: Exposure
  // Scroll: ScrollSlide
  Config: Config
  options: OptionsType
  destroyed: boolean
  autoTrackStart: boolean
  collect: any
  config: any
  apply(collect: any, config: any) {
    this.autoTrackStart = false
    this.collect = collect
    this.config = config
    if (!config.autotrack) return
    if (config.autotrack && config.autotrack.collect_url) {
      if (!config.autotrack.collect_url()) return;
    }
    const { Types } = collect
    this.ready(Types.Autotrack)
    this.collect.emit(Types.AutotrackReady)
  }
  ready(name: string) {
    this.collect.set(name)
    let options = this.config.autotrack
    options = typeof options === 'object' ? options : {}
    options = Object.assign(defaultOpt, options)
    this.destroyed = false
    this.options = options
    this.Config = new Config(defaultConfig, this.options)
    this.Exposure = new Exposure(this.collect, this.config, this.handle.bind(this))
    // this.Scroll = new ScrollSlide(this.config, this.handle.bind(this))
    this.Listener = new Listener(options, this.collect, this.Config)
    this.EventHandle = new EventHandle(this.config, options)
    this.Request = new Request(this.collect)
    this.autoTrackStart = true
    this.init()
    readyToLoadEditor(this, this.config)
  }
  init() {
    this.Listener.init(this.handle.bind(this))
  }
  handle(eventInfo: EventInfo, data?: any) {
    try {
      if (this.config.autotrack.collect_url) {
        if (!this.config.autotrack.collect_url()) return;
      }
    } catch (e) { }
    if (this.collect.sdkStop) return;
    if (eventInfo.eventType === 'dom') {
      this.handleDom(eventInfo, data)
    }
  }
  handleDom(eventInfo: EventInfo, data: any) {
    try {
      const { eventName } = eventInfo
      if (eventName === 'click' || eventName === 'change' || eventName === 'submit') {
        const handleResult = this.EventHandle.handleEvent(data, eventName)
        handleResult && this.Request.send({ eventType: 'custom' }, handleResult)
      } else if (eventName === 'page_view' || eventName === 'page_statistics') {
        let pageData
        if (eventName === 'page_view') {
          pageData = this.EventHandle.handleViewEvent(data)
        } else {
          pageData = this.EventHandle.handleStatisticsEvent(data)
        }
        pageData && this.Request.send({ eventType: 'custom' }, pageData)
      } else if (eventName === 'beat') {
        const beatData = this.EventHandle.handleBeadtEvent(data)
        const { eventSend } = eventInfo
        beatData && this.Request.send({ eventType: 'custom', eventSend }, beatData)
      } else if (eventName === 'exposure') {
        const handleResult = this.EventHandle.handleExposureEvent(eventInfo, data)
        handleResult && this.Request.send({ eventType: 'custom' }, handleResult)
      } else if (eventName === 'scroll') {
        const handleResult = this.EventHandle.handleScrollEvent(eventInfo, data)
        handleResult && this.Request.send({ eventType: 'custom' }, handleResult)
      }
    } catch (e) {
      console.log(`handel dom event error ${JSON.stringify(e)}`)
    }

  }
  destroy() {
    if (!this.autoTrackStart) {
      return console.warn('engine is undefined, make sure you have called autoTrack.start()')
    }
    this.autoTrackStart = false
    this.Listener.removeListener()
  }
}



