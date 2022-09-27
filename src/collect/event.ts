// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.
import Types from './hooktype';
import Storage from '../util/storage'
import request from '../util/request'
import { beforePageUnload } from '../util/tool'

type TEvent = any;
export default class Event {
  collect: any
  config: any
  configManager: any
  eventKey: string
  beconKey: string
  abKey: string
  cacheStorgae: any
  localStorage: any
  reportTimeout: any
  maxReport: number
  reportTime: number
  timeout: number
  eventLimit: number = 50
  reportUrl: string
  eventCache: TEvent[] = []
  beconEventCache: TEvent[] = []
  apply(collect: any, config: any) {
    this.collect = collect
    this.config = config
    this.configManager = collect.configManager
    this.cacheStorgae = new Storage(true)
    this.localStorage = new Storage(false)
    this.maxReport = config.max_report || 10
    this.reportTime = config.report_time || config.reportTime || 30
    this.timeout = config.timeout || 100000
    this.reportUrl = this.configManager.getUrl('event')
    this.eventKey = `__rangers_cache_events_${this.configManager.get('app_id')}`
    this.beconKey = `__rangers_cache_events_becon_${this.configManager.get('app_id')}`
    this.abKey =`__rangers_sdk_ab_version_${this.configManager.get('app_id')}`
    this.collect.on(Types.Ready, () => {
      this.reportAll(false)
    })
    this.collect.on(Types.ConfigDomain, () => {
      this.reportUrl = this.configManager.getUrl('event')
    })
    this.collect.on(Types.Event, (events: any) => {
      this.event(events)
    });

    this.collect.on(Types.BeconEvent, (events: any) => {
      this.beconEvent(events)
    })
    this.collect.on(Types.CleanEvents, () => {
      // 清除当前的事件
      this.reportAll(false)
    })
    this.linster()
  }

  linster() {
    window.addEventListener('unload', () => {
      this.reportAll(true)
    }, false)
    beforePageUnload(() =>{
      this.reportAll(true)
    })
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.reportAll(true)
      }
    }, false)
  }
  reportAll(becon?: boolean) {
    this.report(becon)
    this.reportBecon()
  }
  event(events: any) {
    try {
      const cache = this.cacheStorgae.getItem(this.eventKey) || []
      const newCache = [...events, ...cache]
      this.cacheStorgae.setItem(this.eventKey, newCache)
      if (this.reportTimeout) {
        clearTimeout(this.reportTimeout)
      }
      if (newCache.length >= this.maxReport) {
        this.report(false)
      } else {
        const _time = this.reportTime
        this.reportTimeout = setTimeout(()=>{
          this.report(false)
          this.reportTimeout = null
        }, _time)
      }
    } catch (e) {}
  }
  beconEvent(events: any) {
    const cache = this.cacheStorgae.getItem(this.beconKey) || []
    const newCache = [...events, ...cache]
    this.cacheStorgae.setItem(this.beconKey, newCache)
    if (this.collect.destroyInstance) return
    if (!this.collect.tokenManager.getReady()) return
    if (!this.collect.sdkReady) return
    this.cacheStorgae.removeItem(this.beconKey)
    this.send(this.split(this.merge(newCache)), true)
  }
  reportBecon() {
    const cache = this.cacheStorgae.getItem(this.beconKey) || []
    if (!cache || !cache.length) return
    this.cacheStorgae.removeItem(this.beconKey)
    this.send(this.split(this.merge(cache)), true)
  }
  report(becon: boolean) {
    if (this.collect.destroyInstance) return
    if (!this.collect.tokenManager.getReady()) return
    if (!this.collect.sdkReady) return
    const eventData = this.cacheStorgae.getItem(this.eventKey) || []
    if (!eventData.length) return
    this.cacheStorgae.removeItem(this.eventKey)
    this.sliceEvent(eventData, becon);
  }
  sliceEvent(events: any, becon: boolean) {
    if (events.length > this.eventLimit) {
      for(let i = 0; i < events.length; i += this.eventLimit) {
        let result = []
        result = events.slice(i, i + this.eventLimit);
        const mergeData = this.split(this.merge(result));
        this.send(mergeData, becon);
      }
    } else {
      const mergeData = this.split(this.merge(events));
      this.send(mergeData, becon);
    }
  }
  merge(events: any) {
    const { header, user } = this.configManager.get()
    header.custom = JSON.stringify(header.custom)
    const evtParams = this.configManager.get('evtParams')
    const mergeEvents = events.map(item => {
      try {
        if (Object.keys(evtParams).length) {
          item.params = { ...evtParams, ...item.params }
        }
        const abCache = this.localStorage.getItem(this.abKey)
        if (abCache && abCache.uuid && abCache.uuid === user.user_unique_id) {
          if (this.configManager.getAbVersion()) {
            item.ab_sdk_version = this.configManager.getAbVersion()
          }
        }
        item.session_id = this.collect.sessionManager.getSessionId()
        item.params = JSON.stringify(item.params)
        return item;
      } catch (e) {
        return item;
      }
    })
    const resultEvent = JSON.parse(
      JSON.stringify({
        events: mergeEvents,
        user,
        header,
      }),
    );
    resultEvent.local_time = Math.floor(Date.now() / 1000);
    resultEvent.user_unique_type = this.config.enable_ttwebid ? this.config.user_unique_type : undefined
    let mergeData = []
    mergeData.push(resultEvent)
    return mergeData
  }
  split(eventData: any) {
    eventData = eventData.map(item =>{
      const _item = []
      _item.push(item)
      return _item
    })
    return eventData
  }
  send(events: any, becon: boolean) {
    if (!events.length) return
    events.forEach(originItem => {
      try {
        let filterItem = JSON.parse(JSON.stringify(originItem))
        if (this.config.filter) {
          filterItem = this.config.filter(filterItem)
          if (!filterItem) {
            console.warn('filter must return data !!')
          }
        }
        if (this.collect.eventFilter && filterItem) {
          filterItem = this.collect.eventFilter(filterItem)
          if (!filterItem) {
            console.warn('filterEvent api must return data !!')
          }
        }
        const reportItem = filterItem || originItem
        this.collect.emit(Types.SubmitBefore, reportItem);
        this.collect.emit(Types.SubmitVerify, reportItem);
        request(this.reportUrl, reportItem, this.timeout, false,
          (res, data) => {
            if (res && res.e !== 0) {
              this.collect.emit(Types.SubmitError, { type:'f_data', eventData: data, errorCode: res.e, response: res });
            } else {
              this.collect.emit(Types.SubmitScuess, { eventData: data, res });
            }
          },
          (eventData, errorCode) => {
            this.configManager.get('reportErrorCallback')(eventData, errorCode)
            this.collect.emit(Types.SubmitError, { type:'f_net', eventData, errorCode })
          },becon
        ) 
        this.collect.emit(Types.SubmitAfter, reportItem);
      } catch (e) {
        console.warn(`something error, ${JSON.stringify(e.stack)}`)
      }      
    })
  }
}