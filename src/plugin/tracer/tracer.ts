import { beforePageUnload } from '../../util/tool'
import { SDK_VERSION } from '../../collect/constant'
import { getLogPluginSpace } from '../../collect/namespace'

enum State {
  Net = 'net',
  FailNet = 'f_net',
  FailData = 'f_data'
}
interface PARAMS {
  count: number
  state: State
  key: string
  params_for_special: string,
  aid: number,
  platform: 'web',
  errorCode?: string,
  _staging_flag: 1,
  sdk_version: string,
}
const EventList = {
  pv: [
    'predefine_pageview'
  ],
  sdk: [
    '_be_active', 'predefine_page_alive', 'predefine_page_close',
    '__profile_set', '__profile_set_once', '__profile_increment',
    '__profile_unset', '__profile_append'
  ],
  autotrack: [
    'bav2b_click', 'bav2b_page', 'bav2b_beat', 'bav2b_page_statistics',
    '__bav_click', '__bav_page', '__bav_beat', '__bav_page_statistics'
  ]
}
export default class Tracer {
  count: any
  ready: boolean
  errorInfo: any
  event: any
  process: any
  storage: any
  countKey: string
  appid: string
  reportUrl: string
  collect: any
  errorCode: any
  limit: any
  tracerCache: any
  fetch: any
  apply(collect: any, config: any) {
    this.ready = config.app_id && config.enable_tracer && !config.disable_track_event
    if (!this.ready) return; 
    this.limit = {
      pv: 1, // pv事件
      sdk: 3, // sdk内部事件
      autotrack: 3, // 无埋点事件
      log: 3 // 正常业务埋点
    }
    this.errorCode = {
      'f_net': 0,
      'f_data': 0
    }
    this.tracerCache = new Map()
    this.collect = collect
    this.appid = config.app_id
    this.reportUrl = collect.configManager.getUrl('event')
    const { Types } = this.collect
    const { fetch } = collect.adapters
    this.fetch = fetch
    this.collect.on(Types.Event, () => {
      this.addCount('log')
    })
    this.collect.on(Types.SubmitError, (data) => {
      const { type, eventDate, errorCode, response} = data
      this.addErrorCount(eventDate, type, errorCode, response)
    })
    this.listener()
    this.collect.emit(Types.TracerReady)
  }
  addCount(key: string, state: string = 'net', num: number = 1) {
    try {
      if (!this.tracerCache) {
        this.tracerCache = new Map()
      }  
      let currentCount
      if (!this.tracerCache.has(key)) {
        const stateMap = new Map()
        currentCount = num
        stateMap.set(state, this.processTracer(num, key, state))
        this.tracerCache.set(key, stateMap)
      } else {
        let stateMap = this.tracerCache.get(key)
        if (!stateMap.has(state)){
          currentCount = num
          stateMap.set(state, this.processTracer(num, key, state))
        } else {
          let current = stateMap.get(state)
          currentCount = current.params.count
          currentCount++
          stateMap.set(state, this.processTracer(currentCount, key, state))
        }
      }
      if (state === 'net' && currentCount >= this.limit[key]) {
        // 当某个key达到上限时，全部上报
        this.report(false)
      }
    } catch (e) {
      console.log(e)
    }
  }
  addErrorCount(errorData: any, state: string, errorCode: any, response?: any) {
    try {
      if (errorData && errorData.length) {
        let errorEvent = errorData[0].events
        if (errorEvent && errorEvent.length) {
          if (state === 'f_data') {
            // 数据异常
            if (response && response.hasOwnProperty('sc')) {
              this.addCount('log', state, errorEvent.length - response.sc) // 数据出错的数量
            } else {
              // 海外请求没有sc
              this.addCount('log', state, errorEvent.length) // 数据出错的数量
            }
            this.errorCode[state] = errorCode
          } else {
            // 网络异常
            errorEvent.forEach(item => {
              let errorKey = 'log'
              for(let key in EventList) {
                if (EventList[key].indexOf(item.event) !== -1) {
                  // 识别错误的事件类型
                  errorKey = key
                  break;
                }
              }
              this.addCount(errorKey, state, 1)
              this.errorCode[state] = errorCode
            })
          }
        }
      }
    } catch (e) {}
  }
  report(becon: boolean) {
    // 处理上报数据
    if (!this.tracerCache) return
    let tracerEventList = []
    this.tracerCache.forEach(state => {
      console.log(state)
      state.forEach(item => {
        tracerEventList.push(item)
      })
    })
    if (tracerEventList && tracerEventList.length) {
      this.sendTracer(tracerEventList, becon)
    }
  }
  sendTracer(traceData: any, becon: boolean) {
    try {
      const data = this.collect.eventManager.merge(traceData)
      if (becon && window.navigator.sendBeacon) {
        window.navigator.sendBeacon(this.reportUrl, JSON.stringify(data))
      } else {
        this.fetch(this.reportUrl, data)
      }
      this.tracerCache = null
    } catch (e) {}
  }
  processTracer(count: number, key: string, state: string) {
    let tracerParams = {
      count,
      state,
      key,
      params_for_special: 'applog_trace',
      aid: this.appid,
      platform: 'web',
      _staging_flag: 1,
      sdk_version: SDK_VERSION,
    }
    if (state === 'f_net' || state === 'f_data') {
      tracerParams['errorCode'] = this.errorCode[state]
    }
    let tracerEvent = this.collect.processEvent('applog_trace', tracerParams)
    if (tracerEvent && tracerEvent.event) {
      delete tracerEvent['is_bav']
      return tracerEvent
    }
  }
  listener() {
    document.addEventListener('visibilitychange', ()=>{
      if (document.visibilityState === 'hidden') {
        this.leavePage()
      }
    })
    beforePageUnload(()=>{
      this.leavePage()
    })
    // setTimeout(()=>{
    //   this.leavePage()
    // }, 5000)
}
  leavePage() {
    // 离开页面时上报
    this.report(true)
  }
}

/**@@SCRIPT
 const exportTracer = (collect: any, config: any) => {
  const tracer = new Tracer()
  tracer.apply(collect, config)
}
try {
  const pluginObject = getLogPluginSpace()
  if (pluginObject) {
    pluginObject.LogTracer = exportTracer
  }
} catch (e) {
  console.log(e)
}
@@SCRIPT*/