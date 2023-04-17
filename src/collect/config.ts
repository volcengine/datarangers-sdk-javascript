// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

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
const REPORT_URL = '/list'

export default class ConfigManager {
  collect: any
  envInfo: any
  evtParams: any
  reportErrorCallback: any
  initConfig: any
  sessionStorage: any
  localStorage: any
  storage: any
  configKey: string
  domain: string
  is_first_time: boolean = true
  constructor(collect: any, initConfig: any) {
    this.initConfig = initConfig
    this.collect = collect
    const client = new Client(initConfig.app_id)
    const commonInfo = client.init()
    const firstKey = `__tea_cache_first_${initConfig.app_id}`
    this.configKey = `__tea_cache_config_${initConfig.app_id}`
    this.sessionStorage = new Storage(false, 'session')
    this.localStorage = new Storage(false, 'local')
    const firstStatus = this.localStorage.getItem(firstKey)
    if (firstStatus && firstStatus == 1) {
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
        user_unique_id_type: undef,
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
        creative_id: undef,
        ad_id: undef,
        campaign_id: undef,
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

        utm_term: undef,
        utm_content: undef,
        utm_source: undef,
        utm_medium: undef,
        utm_campaign: undef,
        custom: {},

        wechat_unionid: undef,
        wechat_openid: undef,
      },
    }
    this.evtParams = {};
    // 事件处理函数
    this.reportErrorCallback = () => { }
    this.initDomain();
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
  getUrl(type: string) {
    let report = ''
    switch (type) {
      case 'event':
        report = this.initConfig.report_url || REPORT_URL
        break;
      case 'webid':
        report = WEBID_URL
        break;
    }
    let query = ''
    return `${this.getDomain()}${report}${query}`
  }
  set(info: any) {
    Object.keys(info).forEach((key) => {
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
        if (Object.hasOwnProperty.call(this.envInfo.user, key)) {
          if (['user_id', 'web_id', 'user_unique_id'].indexOf(key) > -1) {
            this.envInfo.user[key] = info[key] ? String(info[key]) : info[key]
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
        } else if (key === 'reportErrorCallback') {
          return this[key]
        } else if (Object.hasOwnProperty.call(this.envInfo.user, key)) {
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
}