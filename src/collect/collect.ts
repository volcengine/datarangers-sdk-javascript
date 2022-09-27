// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import { IInitParam, IConfigParam} from '../../types/types'
import Hook from '../util/hook';
import { THook, THookInfo } from '../util/hook';
import { isObject, isNumber, isString, getIndex, hashCode } from '../util/tool';
import ConfigManager from './config'
import Logger from '../util/log'
import Types from './hooktype';
import AppBridge from '../util/jsbridge'
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
  new ();
  apply:(collect: Collector, options: IInitParam) => void
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
  logger: any
  Types: any
  configManager: any
  appBridge: any
  eventManager: any
  tokenManager: any
  sessionManager: any
  disableAutoPageView: boolean = false
  bridgeReport: boolean = false
  staging: boolean = false
  initConfig: any
  static plugins: Array<Plugin> = []
  pluginInstances: Array<IPlugin> = []
  sended: boolean = false
  started: boolean = false
  remotePlugin: any
  eventFilter: any
  destroyInstance: boolean = false
  adapters: Record<string, any> = {}
  sdkReady: boolean = false
  constructor(name: string) {
    this.name = name
    this.hook = new Hook()
    this.logger = new Logger(name)
    this.remotePlugin = new Map()
    this.Types = Types
    this.adapters['fetch'] = fetch 
    this.adapters['storage'] = Storage
  }
  static usePlugin(plugin: IPlugin, name?: string, options?: any) {
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
  init(initConfig: IInitParam){
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
    if (!initConfig.channel_domain && ['cn','sg','va'].indexOf(initConfig.channel) === -1) {
      console.warn('channel must be `cn`, `sg`,`va` !!!')
      initConfig.channel = 'cn'
    }
    this.inited = true
    this.appBridge = new AppBridge(initConfig.enable_native)
    this.bridgeReport = this.appBridge.bridgeInject()
    this.configManager = new ConfigManager(initConfig)
    this.initConfig = initConfig
    if (!this.bridgeReport) {
      this.configManager.set({app_id: initConfig.app_id})
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
          console.log(`load plugin error, ${e.message}`)
        }
        this.sdkReady = true;
        this.emit(Types.Ready);  
        console.info(`[${this.name}] appid: ${initConfig.app_id}, userInfo:${JSON.stringify(this.configManager.get('user'))}`);
        console.info(`[${this.name}] appid: ${initConfig.app_id}, sdk is ready, version is ${SDK_VERSION}, you can report now !!!`);
        try {
          (window.opener || window.parent).postMessage('rangers-sdk]ready', '*');
        } catch (e) {}
        if (initConfig.disable_auto_pv) {
          this.disableAutoPageView = true;
        }
        this.pageView();
        this.on(Types.TokenChange, (tokenType: string) => {
          if (tokenType === 'webid') {
            this.pageView();
          }
          console.info(`[${this.name}] appid: ${initConfig.app_id} token change, new userInfo:${JSON.stringify(this.configManager.get('user'))}`)
        })
        this.on(Types.TokenReset, () => {
          console.info(`[${this.name}] appid: ${initConfig.app_id} token reset, new userInfo:${JSON.stringify(this.configManager.get('user'))}`)
        })
        this.on(Types.RouteChange, (info) => {
          if (info.init) return;
          if (initConfig.disable_route_report) return;
          this.pageView();
        })
      })
      this.tokenManager.apply(this, initConfig)
      this.eventManager.apply(this, initConfig)
      this.sessionManager.apply(this, initConfig)
      this.emit(Types.Init)
    }
  }
  config(configs: IConfigParam) {
    if (!this.inited) {
      this.logger.warn('config must be use after function init')
      return;
    }
    if (!configs || !isObject(configs)) {
      this.logger.warn('config params is error, please check')
      return;
    }
    if (this.bridgeReport) {
      this.appBridge.setConfig(configs)
    } else {
      if (configs._staging_flag && configs._staging_flag === 1) {
        this.staging = true
      }
      if (configs.disable_auto_pv) {
        this.disableAutoPageView = true;
        delete configs['disable_auto_pv']
      }
      let newConfig = { ...configs }
      if (this.initConfig && this.initConfig.configPersist) {
        let cacheConfig = this.configManager.getStore()
        if (cacheConfig) {
          newConfig = Object.assign(cacheConfig, configs)
        }
        this.configManager.setStore(configs)
      }   
      const {
        web_id: webId,
        user_unique_id: userUniqueId,
        ...otherConfigs
      } = newConfig
      if (newConfig.hasOwnProperty('web_id')) {
        this.emit(Types.ConfigWebId, newConfig['web_id'])
      }
      if (newConfig.hasOwnProperty('user_unique_id')) {
        this.emit(Types.ConfigUuid, newConfig['user_unique_id'])
      }
      this.configManager.set(otherConfigs)
    }
  }
  setDomain(domain: string) {
    this.configManager && this.configManager.setDomain(domain)
    this.emit(Types.ConfigDomain)
  }
  getConfig(key?: string) {
    return this.configManager.get(key)
  }
  send() {
    this.start();
  }
  start() {
    if (!this.inited || this.sended) return
    this.sended = true
    this.emit(Types.Start)
  }
  event(event: string | TEvent[], params?: any) {
    try {
      if (this.initConfig && this.initConfig.disable_track_event) return;
      const events = [];
      if (Array.isArray(event)) {
        event.forEach((each) => {
          events.push(this.processEvent(each[0], each[1] || {}))
        })
      } else {
        events.push(this.processEvent(event, params))
      }
      if (this.bridgeReport) {
        events.forEach(item => {
          const { event, params } = item
          this.appBridge.onEventV3(event, JSON.stringify(params))
        })
      } else {
        if (events.length) {
          this.emit(Types.Event, events)
          this.emit(Types.SessionResetTime)
        }
      }
    } catch (e) {
      console.warn('something error, please check')
    }
  }
  beconEvent(event: string, params?: any) {
    if (this.initConfig && this.initConfig.disable_track_event) return;
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
      if (localParams.profile) {
        delete localParams['profile']
      } else {
        localParams.event_index = getIndex()
      }
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
        is_bav: this.initConfig && this.initConfig.autotrack ? 1 : 0
      }
      return evtData
    } catch (e) {
      return { event: _event, params }
    }
  }

  filterEvent(filter: any) {
    this.eventFilter = filter
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

  emit(type: string, info?: THookInfo, wait?:string) {
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
    var defaultPvParams = {
      title: document.title || location.pathname,
      url: location.href,
      url_path: location.pathname,
      time: Date.now(),
      referrer: window.document.referrer,
      $is_first_time: `${this.configManager.is_first_time}`
    }
    var mergedParams = {
      ...defaultPvParams,
      ...params,
    }
    this.event('predefine_pageview', mergedParams)
  }
  clearEventCache() {
    this.emit(Types.CleanEvents)
  }
  setWebIDviaUnionID(unionId: string) {
    if (!unionId) {
      return;
    }
    const webId = hashCode(unionId);
    this.config({
      web_id: `${webId}`,
      wechat_unionid: unionId,
    });
    this.emit(Types.CustomWebId)
  }

  setWebIDviaOpenID(openId: string) {
    if (!openId) {
      return;
    }
    const webId = hashCode(openId);
    this.config({
      web_id: `${webId}`,
      wechat_openid: openId,
    });
    this.emit(Types.CustomWebId)
  }

  setNativeAppId(appId: number) {
    if (!this.bridgeReport) return
    this.appBridge.setNativeAppId(appId)
  }

  /** stay相关api */
  resetStayDuration(url_path: string = '' , title: string = '', url: string = '') {
    this.emit(Types.ResetStay, {url_path, title, url}, Types.Stay)
  }
  resetStayParams(url_path: string = '' , title: string = '', url: string = '') {
    this.emit(Types.SetStay, {url_path, title, url}, Types.Stay)
  }
  getToken(callback: any, timeout?: number) {
    let tokenReturn = false
    const callbackUser = (tobid?: string) => {
      if (tokenReturn) return
      tokenReturn = true
      const { user } = this.configManager.get()
      if (tobid) {
        user['tobid'] = tobid
        user['diss'.split('').reverse().join('')] = tobid
      }
      return callback({ ...user })
    }
    const getId = () => {
      this.tokenManager.getTobId().then(res => {
        callbackUser(res)
      })
    }
    if (this.sdkReady) {
      getId()
      return
    }
    if (timeout) {
      setTimeout(() => {
        callbackUser()
      }, timeout)
    }
    this.on(Types.Ready, () => {
      getId()
    })
  }

  /** profile相关api */
  profileSet(profile: ProfileParams){
    if (this.bridgeReport) {
      this.appBridge.profileSet(JSON.stringify(profile))
    } else {
      this.emit(Types.ProfileSet, profile, Types.Profile)
    }
  }
  
  profileSetOnce(profile: ProfileParams){
    if (this.bridgeReport) {
      this.appBridge.profileSetOnce(JSON.stringify(profile))
    } else {
      this.emit(Types.ProfileSetOnce, profile, Types.Profile)
    }
  }
  
  profileIncrement(profile: ProfileParams){
    if (this.bridgeReport) {
      this.appBridge.profileIncrement(JSON.stringify(profile))
    } else {
      this.emit(Types.ProfileIncrement, profile, Types.Profile)
    }
  }
  
  profileUnset(key: string){
    if (this.bridgeReport) {
      this.appBridge.profileUnset(key)
    } else {
      this.emit(Types.ProfileUnset, key, Types.Profile)
    }
  }
  
  profileAppend(profile: ProfileParams){
    if (this.bridgeReport) {
      this.appBridge.profileAppend(JSON.stringify(profile))
    } else {
      this.emit(Types.ProfileAppend, profile, Types.Profile)
    }
  }

  /** ab相关api */
  setExternalAbVersion(vids: string) {
    this.emit(
      Types.AbExternalVersion,
      typeof vids === 'string' && vids ? `${vids}`.trim() : null,
      Types.Ab
    )
  }

  getVar(name, defaultValue, callback) {
    this.emit(Types.AbVar, {name, defaultValue, callback}, Types.Ab)
  }

  getABconfig(param: any, callback: any) {
    this.emit(Types.AbConfig, {param, callback}, Types.Ab)
  }
  getAbSdkVersion() {
    return this.configManager.getAbVersion() || ''
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

  destoryInstace() {
    if (this.destroyInstance) return
    this.destroyInstance = true
    this.off(Types.TokenComplete)
  }
}

