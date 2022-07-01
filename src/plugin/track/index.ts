// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.
import Listener from './listener'
import Config , { defaultConfig } from './config'
import EventHandle from './event'
import Request from './request'
import { OptionsType, EventInfo } from './type'
import readyToLoadEditor from './load'

const defaultOpt = {
  hashTag: false,
  impr: false,
}
export default class AutoTrack {
  engine: any
  Listener: Listener
  EventHandle: EventHandle
  Request: Request
  Config: Config
  options: OptionsType
  destroyed: boolean
  autoTrackStart: boolean
  collect: any
  config: any
  apply(collect: any, config: any){
    this.autoTrackStart = false
    this.collect = collect
    this.config = config
    if (!config.autotrack) return
    const { Types } = collect
    if (config.autotrack && config.autotrack.collect_url) {
      if (!config.autotrack.collect_url()) return;
    }
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
    this.Config = new Config(defaultConfig)
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
  handle( _eventInfo: EventInfo, _data?: any) {
    const { eventType } = _eventInfo
    if (eventType === 'dom') {
      this.handleDom(_eventInfo, _data)
    }
  }
  handleDom(eventInfo: EventInfo, data: any) {
    try {
      const { eventName } = eventInfo
      if (eventName === 'click' || eventName === 'change' || eventName === 'submit') {
        const handleResult = this.EventHandle.handleEvent(data, eventName)
        handleResult !== null && this.Request.send({ eventType: 'custom', eventName: `report_${eventName}_event`, extra: { methods: 'GET' } }, handleResult)
      } else if (eventName === 'page_view' || eventName === 'page_statistics') {
        let pageData
        if (eventName === 'page_view') {
          pageData = this.EventHandle.handleViewEvent(data)
        } else {
          pageData = this.EventHandle.handleStatisticsEvent(data)
        }
        this.Request.send({ eventType: 'custom', eventName: 'report_${eventName}_event', extra: { methods: 'GET' } }, pageData)
      } else if (eventName === 'beat') {
        const beatData = this.EventHandle.handleBeadtEvent(data)
        const { eventSend } = eventInfo
        this.Request.send({ eventType: 'custom', eventName: 'report_${eventName}_event', extra: { methods: 'GET' }, eventSend }, beatData)
      }
    } catch(e){
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



