import Client from '../util/client'
import Storage from '../util/storage'
import { decodeUrl } from '../util/tool'
import { SDK_VERSION, LOG_URL } from './constant'


const undef = undefined
const date = new Date()
const timeZoneMin = date.getTimezoneOffset()
const timezone = parseInt(`${-timeZoneMin / 60}`, 10)
const tz_offset = timeZoneMin * 60

const WEBID_URL = '/webid'
const TOB_URL = '/tobid'
const REPORT_URL = '/list'
const EXPIRE_TIME = 60 * 60 * 1000 * 24 * 90

export default class ConfigManager {
  envInfo: any
  evtParams: any
  filter: any
  reportErrorCallback: any
  initConfig: any
  sessionStorage: any
  localStorage: any
  storage: any
  configKey: string
  domain: string
  ab_version: any
  is_first_time: boolean = true
  isLast: boolean
  configPersist: boolean = false
  constructor(initConfig: any) {
    this.initConfig = initConfig
    const client = new Client(initConfig.app_id, initConfig.cookie_domain || '', initConfig.cookie_expire || EXPIRE_TIME)
    const commonInfo = client.init()
    const firstKey = `__tea_cache_first_${initConfig.app_id}`
    this.configKey = `__tea_cache_config_${initConfig.app_id}`
    this.sessionStorage = new Storage(false, 'session')
    this.localStorage = new Storage(false, 'local')
    if (initConfig.configPersist) {
      this.configPersist = true
      this.storage = initConfig.configPersist === 1 ? this.sessionStorage : this.localStorage
    }
    if (this.localStorage.getItem(firstKey)) {
      this.is_first_time = false
    } else {
      this.is_first_time = true
      this.localStorage.setItem(firstKey, '1')
    }
    this.envInfo = {
      user: {
        user_unique_id: undef,
        user_type: undef,
        user_id: undef, 
        user_is_auth: undef,
        user_is_login: undef,
        device_id: undef,
        web_id: undef,
        ip_addr_id: undef,
      },
      header: {
        app_id: undef,
        app_name: undef,
        app_install_id: undef,
        install_id: undef,
        app_package: undef,
        app_channel: undef,
        app_version: undef,
        ab_version: undef,
        os_name: commonInfo.os_name,
        os_version: commonInfo.os_version,
        device_model: commonInfo.device_model,
        ab_client: undef,
        traffic_type: undef,
        
        client_ip: undef,
        device_brand: undef,
        os_api: undef,
        access: undef,
        language: commonInfo.language,
        region: undef,
        app_language: undef,
        app_region: undef,
        creative_id: commonInfo.utm.creative_id,
        ad_id: commonInfo.utm.ad_id,
        campaign_id: commonInfo.utm.campaign_id,
        log_type: undef,
        rnd: undef,
        platform: commonInfo.platform,
        sdk_version: SDK_VERSION,
        sdk_lib: 'js',
        province: undef,
        city: undef,
        timezone: timezone,
        tz_offset: tz_offset,
        tz_name: undef,
        sim_region: undef,
        carrier: undef,
        resolution: `${commonInfo.screen_width}x${commonInfo.screen_height}`,
        browser: commonInfo.browser,
        browser_version: commonInfo.browser_version,
        referrer: commonInfo.referrer,
        referrer_host: commonInfo.referrer_host,

        width: commonInfo.screen_width,
        height: commonInfo.screen_height,
        screen_width: commonInfo.screen_width,
        screen_height: commonInfo.screen_height,

        utm_term: commonInfo.utm.utm_term,
        utm_content: commonInfo.utm.utm_content,
        utm_source: commonInfo.utm.utm_source,
        utm_medium: commonInfo.utm.utm_medium,
        utm_campaign: commonInfo.utm.utm_campaign,
        tracer_data: JSON.stringify(commonInfo.utm.tracer_data),
        custom:{},

        wechat_unionid: undef,
        wechat_openid: undef,
      },
    }
    this.ab_version = '',
    this.evtParams = {},
    // 事件处理函数
    this.reportErrorCallback = () => {}
    this.isLast = false
    this.setCustom(commonInfo)
    this.initDomain()
  }
  initDomain() {
    const channelDomain = this.initConfig['channel_domain'];
    if (channelDomain) {
      this.domain = channelDomain;
      return;
    }
    let reportChannel = this.initConfig['channel'];
    this.domain = decodeUrl(LOG_URL[reportChannel]);
  }
  setDomain(domain: string) {
    this.domain = domain;
  }
  getDomain() {
    return this.domain;
  }
  setAbVersion(vid: string) {
    this.ab_version = vid
  }
  getAbVersion() {
    return this.ab_version
  }
  getUrl(type: string) {
    let report = ''
    switch (type) {
      case 'event':
        report = this.initConfig.report_url || REPORT_URL
        break;
      case 'webid':
        report = WEBID_URL
        break;
      case 'tobid':
        report = TOB_URL
        break;
    }
    let query = ''
    if (this.initConfig.caller) {
      query =  `?sdk_version=${SDK_VERSION}&sdk_name=web&app_id=${this.initConfig.app_id}&caller=${this.initConfig.caller}`
    }
    return `${this.getDomain()}${report}${query}`
  }
  setCustom(commonInfo) {
    if (commonInfo && commonInfo.latest_data && commonInfo.latest_data.isLast) {
      delete commonInfo.latest_data['isLast']
      this.isLast =true
      for (let key in commonInfo.latest_data) {
        this.envInfo.header.custom[key] = commonInfo.latest_data[key]
      }
    }
  }
  set(info: any) {
    Object.keys(info).forEach((key) => {
      if (info[key] === undefined || info[key] === null) {
        this.delete(key)
      }
      if (key === 'traffic_type' && this.isLast) {
        this.envInfo.header.custom['$latest_traffic_source_type'] = info[key]
      }
      if (key === 'evtParams') {
        this.evtParams = {
          ...(this.evtParams || {}),
          ...(info.evtParams || {}),
        };
      } else if (key === '_staging_flag') {
        this.evtParams = {
          ...(this.evtParams || {}),
          _staging_flag: info._staging_flag,
        };
      } else if (key === 'reportErrorCallback' && typeof info[key] === 'function') {
        this.reportErrorCallback = info[key]
      } else {
        let scope = ''
        let scopeKey = ''
        if (key.indexOf('.') > -1) {
          const tmp = key.split('.')
          scope = tmp[0]
          scopeKey = tmp[1]
        }
        if (scope) {
          if (scope === 'user' || scope === 'header') {
            this.envInfo[scope][scopeKey] = info[key]
          } else {
            this.envInfo.header.custom[scopeKey] = info[key]
          }
        } else if (Object.hasOwnProperty.call(this.envInfo.user, key)) {
          if (['user_type', 'ip_addr_id'].indexOf(key) > -1) {
            this.envInfo.user[key] = info[key] ? Number(info[key]) : info[key]
          } else if (['user_id', 'web_id', 'user_unique_id'].indexOf(key) > -1) {
            this.envInfo.user[key] = info[key] ? String(info[key]) : info[key]
          } else if (['user_is_auth', 'user_is_login'].indexOf(key) > -1) {
            this.envInfo.user[key] = Boolean(info[key])
          } else if (key === 'device_id') {
            this.envInfo.user[key] = info[key]
          }
        } else if (Object.hasOwnProperty.call(this.envInfo.header, key)) {
          this.envInfo.header[key] = info[key]
        } else {
          this.envInfo.header.custom[key] = info[key]
        }
      }
    })
  }

  get(key) { 
    try {
      if (key) {
        if (key === 'evtParams') {
          return this.evtParams
        } else if (key === 'reportErrorCallback'){
          return this[key]
        } else if (Object.hasOwnProperty.call(this.envInfo.user, key)){
          return this.envInfo.user[key]
        } else if (Object.hasOwnProperty.call(this.envInfo.header, key)) {
          return this.envInfo.header[key]
        } else {
          return JSON.parse(JSON.stringify(this.envInfo[key]))
        }
      } else {
        return JSON.parse(JSON.stringify(this.envInfo))
      } 
    } catch (e) {
      console.log('get config stringify error ')
    }
  }
  setStore(config: any) {
    try {
      if (!this.configPersist) return;
      const _cache = this.storage.getItem(this.configKey) || {}
      if (_cache && Object.keys(config).length) {
        const newCache = Object.assign(config, _cache)
        this.storage.setItem(this.configKey, newCache)
      }
    } catch(e) {
      console.log('setStore error')
    }
  }
  getStore() {
    try {
      if (!this.configPersist) return null;
      const _cache = this.storage.getItem(this.configKey) || {}
      if (_cache && Object.keys(_cache).length) {
        return _cache
      } else {
        return null
      }
    } catch(e) {
      return null
    }
  }
  delete(key: string) {
    try {
      if (!this.configPersist) return;
      const _cache = this.storage.getItem(this.configKey) || {}
      if (_cache && Object.hasOwnProperty.call(_cache, key)) {
        delete _cache[key]
        this.storage.setItem(this.configKey, _cache)
      }
    } catch(e) {
      console.log('delete error')
    }
  }
}