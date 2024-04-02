// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import { IInitParam, IConfigParam } from '../../types/types'
import Hook from '../util/hook';
import { THook, THookInfo } from '../util/hook';
import { isObject, isNumber, isString, getIndex } from '../util/tool';
import ConfigManager from './config'
import Types from './hooktype';
import Event from './event'
import Token from './token'
import Session from './session';
import { SDK_VERSION } from './constant'
import Storage from '../util/storage'
import fetch from '../util/fetch'


type TEvent = any;

export type ProfileParams = {
  [key: string]: string | number | boolean | Array<any>;
};


export interface IPlugin {
  new();
  apply: (collect: Collector, options: IInitParam) => void
}
type Plugin = {
  name?: string;
  plugin: IPlugin;
  options?: any
}
export default class Collector {
  name: string
  hook: any
  inited: boolean
  Types: any
  configManager: any
  eventManager: any
  tokenManager: any
  sessionManager: any
  disableAutoPageView: boolean = false
  staging: boolean = false
  initConfig: any
  sended: boolean = false
  started: boolean = false
  adapters: Record<string, any> = {}
  sdkReady: boolean = false
  static plugins: Array<Plugin> = []
  pluginInstances: Array<IPlugin> = []
  constructor(name: string) {
    this.name = name
    this.hook = new Hook()
    this.Types = Types
    this.adapters['fetch'] = fetch
    this.adapters['storage'] = Storage
  }
  static usePlugin(plugin: IPlugin, name?: string, options?: any) {
    // 本地加载
    if (name) {
      let check = false
      for (let i = 0, len = Collector.plugins.length; i < len; i++) {
        const p = Collector.plugins[i]
        if (p.name === name) {
          Collector.plugins[i].plugin = plugin;
          Collector.plugins[i].options = options || {};
          check = true
          break
        }
      }
      if (!check) {
        Collector.plugins.push({ name, plugin, options })
      }
    } else {
      Collector.plugins.push({ plugin })
    }
  }
  init(initConfig: IInitParam) {
    if (this.inited) {
      console.log('init can be call only one time')
      return
    }
    if (!initConfig || !isObject(initConfig)) {
      console.warn('init params error,please check')
      return;
    }
    if (!initConfig.app_id || !isNumber(initConfig.app_id)) {
      console.warn('app_id param is error, must be number, please check!')
      return;
    }
    if (initConfig.app_key && !isString(initConfig.app_key)) {
      console.warn('app_key param is error, must be string, please check!')
      return;
    }
    if (!initConfig.channel_domain && ['cn', 'sg', 'va'].indexOf(initConfig.channel) === -1) {
      console.warn('channel must be `cn`, `sg`,`va` !!!')
      initConfig.channel = 'cn'
    }
    this.inited = true
    this.configManager = new ConfigManager(this, initConfig)
    this.initConfig = initConfig
    if (initConfig.disable_auto_pv) {
      this.disableAutoPageView = true;
    }
    this.configManager.set({ app_id: initConfig.app_id })
    this.eventManager = new Event()
    this.tokenManager = new Token()
    this.sessionManager = new Session()
    Promise.all([
      new Promise<boolean>((resolve) => {
        this.once(Types.TokenComplete, () => {
          resolve(true)
        });
      }),
      new Promise<boolean>((resolve) => {
        this.once(Types.Start, () => {
          resolve(true)
        });
      }),
    ]).then(() => {
      try {
        Collector.plugins.reduce((result, plugin) => {
          const { plugin: P, options } = plugin
          const cloneOptions = Object.assign(this.initConfig, options)
          const instance = new P()
          instance.apply(this, cloneOptions)
          result.push(instance)
          return result
        }, this.pluginInstances)
      } catch (e) {
        console.warn(`load plugin error, ${e.message}`)
      }
      this.sdkReady = true;
      this.emit(Types.Ready);
      console.info(`appid: ${initConfig.app_id}, userInfo:${JSON.stringify(this.configManager.get('user'))}`);
      console.info(`appid: ${initConfig.app_id}, sdk is ready, version is ${SDK_VERSION}, you can report now !!!`);
      this.pageView();
    })
    this.tokenManager.apply(this, initConfig)
    this.eventManager.apply(this, initConfig)
    this.sessionManager.apply(this, initConfig)
    this.emit(Types.Init)
  }
  config(configs: IConfigParam) {
    if (!this.inited) {
      console.warn('config must be use after function init')
      return;
    }
    if (!configs || !isObject(configs)) {
      console.warn('config params is error, please check')
      return;
    }
    if (configs._staging_flag && configs._staging_flag === 1) {
      this.staging = true
    }
    if (configs.disable_auto_pv) {
      this.disableAutoPageView = true;
      delete configs['disable_auto_pv']
    }
    let newConfig = { ...configs }
    const {
      user_unique_id: userUniqueId,
      ...otherConfigs
    } = newConfig
    if (newConfig.hasOwnProperty('user_unique_id')) {
      this.emit(Types.ConfigUuid, newConfig['user_unique_id'])
    }
    this.configManager.set(otherConfigs)
  }
  getConfig(key?: string) {
    return this.configManager.get(key)
  }
  start() {
    if (!this.inited || this.sended) return
    this.sended = true
    this.emit(Types.Start)
  }
  event(event: string | TEvent[], params?: any) {
    try {
      const events = [];
      if (Array.isArray(event)) {
        event.forEach((each) => {
          events.push(this.processEvent(each[0], each[1] || {}))
        })
      } else {
        events.push(this.processEvent(event, params))
      }
      if (events.length) {
        this.emit(Types.Event, events)
        this.emit(Types.SessionResetTime)
      }
    } catch (e) {
      console.warn('something error, please check')
    }
  }
  beconEvent(event: string, params?: any) {
    if (Array.isArray(event)) {
      console.warn('beconEvent not support batch report, please check');
      return;
    }
    const events = [];
    events.push(this.processEvent(event, params || {}))
    if (events.length) {
      this.emit(Types.BeconEvent, events)
      this.emit(Types.SessionResetTime)
    }
  }
  processEvent(_event: string, params: any = {}) {
    try {
      const EVT_REG = /^event\./
      let event = _event
      if (EVT_REG.test(_event)) {
        event = _event.slice(6)
      }
      let localParams = params
      if (typeof localParams !== 'object') {
        localParams = {}
      }
      localParams.event_index = getIndex()
      let local_ms
      if (localParams.local_ms) {
        local_ms = localParams.local_ms
        delete localParams['local_ms']
      } else {
        local_ms = +new Date()
      }
      const evtData = {
        event,
        params: localParams,
        local_time_ms: local_ms,
      }
      return evtData
    } catch (e) {
      return { event: _event, params }
    }
  }

  on(type: string, hook: THook) {
    this.hook.on(type, hook);
  }

  once(type: string, hook: THook) {
    this.hook.once(type, hook);
  }

  off(type: string, hook?: THook) {
    this.hook.off(type, hook);
  }

  emit(type: string, info?: THookInfo, wait?: string) {
    this.hook.emit(type, info, wait);
  }
  set(type: string) {
    this.hook.set(type);
  }
  pageView() {
    if (this.disableAutoPageView) return;
    this.predefinePageView();
  }
  predefinePageView(params: any = {}) {
    const defaultPvParams = {
      title: document.title || location.pathname,
      url: location.href,
      url_path: location.pathname,
      time: Date.now(),
      referrer: window.document.referrer,
      $is_first_time: `${this.configManager && this.configManager.is_first_time}`
    }
    const mergedParams = {
      ...defaultPvParams,
      ...params,
    }
    this.event('predefine_pageview', mergedParams)
  }
  setExternalAbVersion(vids: string) {
    this.emit(
      Types.AbExternalVersion,
      typeof vids === 'string' && vids ? `${vids}`.trim() : null,
      Types.Ab
    )
  }

  getVar(name, defaultValue, callback) {
    this.emit(Types.AbVar, { name, defaultValue, callback }, Types.Ab)
  }

  getABconfig(params: any, callback: any) {
    this.emit(Types.AbConfig, { params, callback }, Types.Ab)
  }
  getAbSdkVersion() {
    return this.configManager.getAbVersion()
  }
  onAbSdkVersionChange(linster: any) {
    this.emit(Types.AbVersionChangeOn, linster, Types.Ab)
    return () => {
      this.emit(Types.AbVersionChangeOff, linster, Types.Ab)
    }
  }
  offAbSdkVersionChange(linster?: any) {
    this.emit(Types.AbVersionChangeOff, linster, Types.Ab)
  }
  openOverlayer() {
    this.emit(Types.AbOpenLayer, '', Types.Ab)
  }

  closeOverlayer() {
    this.emit(Types.AbCloseLayer, '', Types.Ab)
  }

  getAllVars(callback) {
    this.emit(Types.AbAllVars, callback, Types.Ab)
  }
}


