// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import { stringify } from '../../util/tool';

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
  apply(collect: any, config:any) {
    if (!config.spa && !config.autotrack) return;
    this.collect = collect
    this.config = config
    this.appid = config.app_id
    this.fncArray = new Map()
    this.setKey() 
    this.setLocation()
    this.hack()
    this.init()
    this.listener()
    const { Types } = collect
    collect.emit(Types.RouteReady)
  }
  setKey() {
    const { storage } = this.collect.adapters;
    this.storage = new storage(false)
    this.cache_key = `__rangers_cache_refer_${this.appid}`
    this.cache = {
      refer_key: location.href,
      refer_title: document.title || location.pathname,
      refer_manual_key: ''
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
      const config = this.getPopStateChangeEventData()
      this.lastLocation = stringify(location.href, args[1])
      this.sendPv(config, 'pushState')
      return ret
    }
    const oldReplaceState = history.replaceState
    history.replaceState = (state, ...args) =>{
      if (typeof history['onreplacestate'] === 'function') {
        history['onreplacestate']({ state })
      }
      const ret = oldReplaceState.call(history, state, ...args)
      const config = this.getPopStateChangeEventData()
      this.lastLocation = stringify(location.href, args[1])
      this.sendPv(config)
      return ret
    }
  }
  setLocation() {
    if (typeof window !== 'undefined') {
      this.lastLocation = window.location.href
    }
  }
  init() {
    const config = this.getPopStateChangeEventData()
    this.collect.emit('route-change', {config, init: true})
  }
  listener() {
    let timeoutId = null
    const time = 10
    window.addEventListener('hashchange', (e) => {
      if (this.lastLocation === window.location.href) return
      clearTimeout(timeoutId)
    });
    window.addEventListener('popstate', (e) => {
      if (this.lastLocation === window.location.href) {
        return
      }
      timeoutId = setTimeout(() => {
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
      let refer = ''
      const cache_local = this.storage.getItem(this.cache_key) || {}
      let is_first_time = false
      if (!document.referrer) {
        refer = cache_local && cache_local.refer_key || ''
      } else {
        refer = document.referrer
      }
      if (this.storage.getItem(`__rangers_cache_first_${this.appid}`)) {
        is_first_time = false
      } else {
        is_first_time = true
      }
      return {
        is_html: 1,
        url: location.href,
        referrer: refer,
        page_key: location.href,
        refer_page_key: refer,
        page_title: document.title || location.pathname,
        page_manual_key: this.config.autotrack && this.config.autotrack.page_manual_key || '',
        refer_page_manual_key: cache_local && cache_local.refer_manual_key || '',
        refer_page_title: cache_local && cache_local.refer_title || '',
        page_path: location.pathname,
        page_host: location.host,
        is_first_time: `${is_first_time}`
      }
    } catch (e) {
      return {}
    }
    
  }
  sendPv(config: any, name?: string) {
    this.collect.emit('route-change', {config, init: false})
  }
}
export default RuotePage