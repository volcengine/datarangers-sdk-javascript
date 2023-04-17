// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.
import { DebuggerMesssge } from '../../collect/hooktype'

class RuotePage {
  storage: any
  lastLocation: string
  autotrack: boolean = false
  spa: boolean = false
  fncArray: any
  collect: any
  config: any
  cache_key: string
  cache: any = {}
  appid: number
  allowHash: boolean = false
  apply(collect: any, config: any) {
    if (!config.spa && !config.autotrack) return;
    const { Types } = collect
    this.collect = collect
    this.config = config
    this.appid = config.app_id
    this.allowHash = config.allow_hash
    this.fncArray = new Map()
    this.setKey()
    this.setLocation()
    this.hack()
    this.init()
    this.listener()
    collect.emit(Types.RouteReady)
  }
  setKey() {
    const { storage } = this.collect.adapters;
    this.storage = new storage(false)
    this.cache_key = `__tea_cache_refer_${this.appid}`
    this.cache = {
      refer_key: '',
      refer_title: document.title || location.pathname,
      refer_manual_key: '',
      routeChange: false
    }
    if (this.config.autotrack && typeof this.config.autotrack === 'object' && this.config.autotrack.page_manual_key) {
      this.cache.refer_manual_key = this.config.autotrack.page_manual_key
    }
    this.storage.setItem(this.cache_key, this.cache)
  }
  hack() {
    const oldPushState = window.history.pushState;
    history.pushState = (state, ...args) => {
      if (typeof history['onpushstate'] === 'function') {
        history['onpushstate']({ state })
      }

      const ret = oldPushState.call(history, state, ...args)
      if (this.lastLocation === location.href) return;
      const config = this.getPopStateChangeEventData()
      this.setReferCache(this.lastLocation)
      this.lastLocation = location.href;
      this.sendPv(config, 'pushState')
      return ret
    }
    const oldReplaceState = history.replaceState
    history.replaceState = (state, ...args) => {
      if (typeof history['onreplacestate'] === 'function') {
        history['onreplacestate']({ state })
      }

      const ret = oldReplaceState.call(history, state, ...args)
      if (this.lastLocation === location.href) return;
      const config = this.getPopStateChangeEventData()
      this.setReferCache(this.lastLocation)
      this.lastLocation = location.href;
      this.sendPv(config)
      return ret
    }
  }
  setLocation() {
    if (typeof window !== 'undefined') {
      this.lastLocation = window.location.href
    }
  }
  getLocation() {
    return this.lastLocation
  }
  init() {
    const config = this.getPopStateChangeEventData()
    this.collect.emit('route-change', { config, init: true })
  }
  listener() {
    let timeoutId = null
    const time = 10
    window.addEventListener('hashchange', (e) => {
      if (this.lastLocation === window.location.href) return
      clearTimeout(timeoutId)
      if (this.allowHash) { // 如果允许hashTag，就执行回调函数
        this.setReferCache(this.lastLocation)
        this.lastLocation = window.location.href
        const config = this.getPopStateChangeEventData();
        this.sendPv(config);
      }
    });
    window.addEventListener('popstate', (e) => {
      if (this.lastLocation === window.location.href) {
        return
      }
      timeoutId = setTimeout(() => {
        this.setReferCache(this.lastLocation)
        this.lastLocation = window.location.href
        const config = this.getPopStateChangeEventData()
        this.sendPv(config)
      }, time)
    })
  }
  getPopStateChangeEventData() {
    const config = this.pageConfig()
    config['is_back'] = 0
    return config
  }
  pageConfig() {
    try {
      const cache_local = this.storage.getItem(this.cache_key) || {}
      let is_first_time = false
      const firstStatus = this.storage.getItem(`__tea_cache_first_${this.appid}`)
      if (firstStatus && firstStatus == 1) {
        is_first_time = false
      } else {
        is_first_time = true
      }
      return {
        is_html: 1,
        url: location.href,
        referrer: this.handleRefer(),
        page_key: location.href,
        refer_page_key: this.handleRefer(),
        page_title: document.title || location.pathname,
        page_manual_key: this.config.autotrack && this.config.autotrack.page_manual_key || '',
        refer_page_manual_key: cache_local && cache_local.refer_manual_key || '',
        refer_page_title: cache_local && cache_local.refer_title || '',
        page_path: location.pathname,
        page_host: location.host,
        is_first_time: `${is_first_time}`
      }
    } catch (e) {
      this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, info: '发生了异常', level: 'error', time: Date.now(), data: e.message });
      return {}
    }
  }
  sendPv(config: any, name?: string) {
    this.collect.emit('route-change', { config, init: false })
  }
  handleRefer() {
    let refer = ''
    try {
      const cache_local = this.storage.getItem() || {}
      if (cache_local.routeChange) {
        // 已经发生路由变化
        refer = cache_local.refer_key;
      } else {
        // 首页，用浏览器的refer
        refer = this.collect.configManager.get('referrer');
      }
    } catch (e) {
      refer = document.referrer;
    }

    return refer
  }
  setReferCache(url: string) {
    const cache_local = this.storage.getItem(this.cache_key) || {}
    cache_local.refer_key = url
    // 不再是第一次进入页面
    cache_local.routeChange = true
    this.storage.setItem(this.cache_key, cache_local)
  }
}
export default RuotePage
