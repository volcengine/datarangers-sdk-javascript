// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import Types from './hooktype';
import { IInitParam } from '../../types/types'
import Storage from '../util/storage'
import request from '../util/request'
import { beforePageUnload, encodeBase64, decodeBase64 } from '../util/tool'
import { DebuggerMesssge } from './hooktype';
import EventCheck from '../plugin/check/check';

type TEvent = any;
export default class Event {
  collect: any
  config: IInitParam
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
  eventCheck: any
  refer_key: string
  apply(collect: any, config: IInitParam) {
    this.collect = collect
    this.config = config
    this.configManager = collect.configManager
    this.cacheStorgae = new Storage(true)
    this.localStorage = new Storage(false)
    this.eventCheck = new EventCheck(collect, config)
    this.maxReport = config.max_report || 20
    this.reportTime = config.reportTime || 30
    this.timeout = config.timeout || 100000
    this.reportUrl = this.configManager.getUrl('event')
    this.eventKey = `__tea_cache_events_${this.configManager.get('app_id')}`
    this.beconKey = `__tea_cache_events_becon_${this.configManager.get('app_id')}`
    this.abKey = `__tea_sdk_ab_version_${this.configManager.get('app_id')}`
    this.refer_key = `__tea_cache_refer_${this.configManager.get('app_id')}`
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
    beforePageUnload(() => {
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
        this.reportTimeout = setTimeout(() => {
          this.report(false)
          this.reportTimeout = null
        }, _time)
      }
    } catch (e) {
      this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, info: '发生了异常', level: 'error', time: Date.now(), data: e.message });
    }
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
      for (let i = 0; i < events.length; i += this.eventLimit) {
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
  handleRefer() {
    let refer = ''
    try {
      if (this.config.spa || this.config.autotrack) {
        const cache_local = this.localStorage.getItem(this.refer_key) || {}
        if (cache_local.routeChange) {
          // 已经发生路由变化
          refer = cache_local.refer_key;
        } else {
          // 首页，用浏览器的refer
          refer = this.configManager.get('referrer');
        }
      } else {
        refer = this.configManager.get('referrer');
      }
    } catch (e) {
      refer = document.referrer;
    }
    return refer
  }
  merge(events: any, ignoreEvtParams?: boolean) {
    const { header, user } = this.configManager.get()
    header.referrer = this.handleRefer();
    header.custom = JSON.stringify(header.custom)
    const evtParams = this.configManager.get('evtParams')
    const type = this.configManager.get('user_unique_id_type')
    const mergeEvents = events.map(item => {
      try {
        if (Object.keys(evtParams).length && !ignoreEvtParams) {
          item.params = { ...item.params, ...evtParams }
        }
        if (this.collect.dynamicParamsFilter) {
          const dynamic = this.collect.dynamicParamsFilter();
          if (Object.keys(dynamic).length) {
            item.params = { ...item.params, ...dynamic }
          }
        }
        if (type) {
          item.params['$user_unique_id_type'] = type
        }
        const abCache = this.configManager.getAbCache();
        const abVersion = this.configManager.getAbVersion()
        if (abVersion && abCache) {
          if (this.config.disable_ab_reset) {
            // 不校验ab的uuid
            item.ab_sdk_version = abVersion
          } else if (abCache.uuid === user.user_unique_id) {
            item.ab_sdk_version = abVersion
          }
        }
        item.session_id = this.collect.sessionManager.getSessionId()
        item.params = JSON.stringify(item.params)
        return item;
      } catch (e) {
        this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, info: '发生了异常', level: 'error', time: Date.now(), data: e.message });
        return item;
      }
    })
    let mergeData = []
    if (!Object.keys(user).length) {
      console.warn('user info error，cant report')
      return mergeData
    }
    if (this.config.enable_anonymousid) {
      delete user.web_id;
    }
    const resultEvent = JSON.parse(
      JSON.stringify({
        events: mergeEvents,
        user,
        header,
      }),
    );
    resultEvent.local_time = Math.floor(Date.now() / 1000);
    resultEvent.verbose = 1;
    resultEvent.user_unique_type = this.config.enable_ttwebid ? this.config.user_unique_type : undefined;
    mergeData.push(resultEvent)
    return mergeData
  }
  split(eventData: any) {
    eventData = eventData.map(item => {
      const _item = []
      _item.push(item)
      return _item
    })
    return eventData
  }
  send(events: any, becon: boolean) {
    if (!events.length) return;
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
        const reportItem = filterItem || originItem;
        const checkItem = JSON.parse(JSON.stringify(reportItem));
        this.eventCheck.checkVerify(checkItem);
        if (!reportItem.length) return;
        this.collect.emit(Types.SubmitBefore, reportItem);
        const encodeItem = this.collect.cryptoData(reportItem);
        request(this.reportUrl, encodeItem, this.timeout, false,
          (res, data) => {
            if (res && res.e !== 0) {
              this.collect.emit(Types.SubmitError, { type: 'f_data', eventData: data, errorCode: res.e, response: res });
              this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_EVENT, info: '埋点上报失败', time: Date.now(), data: checkItem, code: res.e, failType: '数据异常', status: 'fail' })
            } else {
              this.collect.emit(Types.SubmitScuess, { eventData: data, res });
              this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_EVENT, info: '埋点上报成功', time: Date.now(), data: checkItem, code: 200, status: 'success' })
            }
          },
          (eventData, errorCode) => {
            this.configManager.get('reportErrorCallback')(eventData, errorCode)
            this.collect.emit(Types.SubmitError, { type: 'f_net', eventData, errorCode })
            this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_EVENT, info: '埋点上报网络异常', time: Date.now(), data: checkItem, code: errorCode, failType: '网络异常', status: 'fail' })

          }, becon, this.config.enable_encryption, this.config.encryption_header
        )
        this.eventCheck.checkVerify(reportItem);
        this.collect.emit(Types.SubmitVerifyH, reportItem);
        this.collect.emit(Types.SubmitAfter, reportItem);
      } catch (e) {
        console.warn(`something error, ${JSON.stringify(e.stack)}`)
        this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, info: '发生了异常', level: 'error', time: Date.now(), data: e.message });
      }
    })
  }
}