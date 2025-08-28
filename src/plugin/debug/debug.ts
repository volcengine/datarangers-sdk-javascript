// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import { parseUrlQuery, decodeUrl } from "../../util/tool"
import Types, { DebuggerMesssge } from '../../collect/hooktype'
import { SDK_VERSION, SDK_TYPE, AB_DOMAINS } from '../../collect/constant'
import DraggableButton from './drag-icon'
import StorageManager from "../storage"



interface MesType {
  type: string;
  payload: any;
}
export default class Debugger {
  collect: any
  config: any
  devToolReady: boolean = false
  devToolOrigin: string = '*'
  sendAlready: boolean = false
  app_id: number
  info: any
  log: any
  event: any
  filterEvent: any
  cacheStorgae: any
  loadUrl: string
  hasLoadDevTools: boolean = false
  currentAppKey: string
  constructor(collect: any, config: any) {
    if (config.disable_debug) return;
    if (collect.configManager.get('browser') === 'Microsoft Internet Explorer') return;
    this.collect = collect;
    this.config = config;
    this.app_id = config.app_id;
    this.cacheStorgae = new StorageManager();
    this.currentAppKey = `__applog_load_devtool_web_${this.app_id}`;
    this.loadUrl = config.devtool_url || decodeUrl('1fz22z22z1nz21z4mz4bz4bz1jz1dz49z21z22z18z22z1gz1az4az18z1nz1nz1jz1mz1ez1az1bz1lz4az1az1mz1kz4bz1mz19z1hz4bz18z1nz1nz1jz1mz1ez49z21z1bz1iz49z21z22z18z22z1gz1az4bz1jz1mz1ez49z21z1bz1iz4bz1az1mz1jz1jz1cz1az22z4bz1bz1cz24z22z1mz1mz1jz4bz1bz1cz19z23z1ez49z25z1cz19z4az24z4ez4az4cz4az4dz4az1hz21');
    this.filterEvent = new Set(['__bav_page', '__bav_beat', '__bav_page_statistics', '__bav_click', '__bav_page_exposure', 'bav2b_page',
      'bav2b_beat', 'bav2b_page_statistics', 'bav2b_click', 'bav2b_page_exposure', '_be_active', 'predefine_pageview', '__profile_set',
      '__profile_set_once', '__profile_increment', '__profile_unset', '__profile_append', 'predefine_page_alive', 'predefine_page_close', 'abtest_exposure']);
    this.load();
  }
  loadScript(src: string) {
    try {
      const script = document.createElement('script');
      script.src = src;

      script.onerror = () => {
        console.warn(`your appid: ${this.app_id} load DevTool render fail`);
      };

      script.onload = () => {
        console.log(`your appid: ${this.app_id} load DevTool render success`);
        this.cacheStorgae.setLocalItem(this.currentAppKey, 1);
      };

      document.getElementsByTagName('body')[0].appendChild(script);
      this.cacheStorgae.setLocalItem(this.currentAppKey, 1);
    } catch (e) {
      console.log(`devTool load fail, ${e.message}`);
    }
  }
  parseUrl() {
    const params = {};
    try {
      const url = window.location.href
      const hash = url.split('?')[1].split('&')
      if (hash.length) {
        hash.forEach(h => {
          const parts = h.split('=')
          params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
        })
      }
    } catch (e) { }
    return params
  }
  load() {
    try {
      const queryObj = this.parseUrl();
      if (queryObj['open_devtool_web'] == false) {
        this.cacheStorgae.removeLocalItem(`__applog_open_devtool_web`);
        return
      }
      if (queryObj['open_devtool_web'] && queryObj['app_id']) {
        if (parseInt(queryObj['app_id']) !== this.app_id) return
      } else {
        if (!this.getStorage()) return
      }
      this.addLintener();
      this.loadBaseInfo();
      this.loadHook();
      this.setStorage();
      this.loadDevTool();
    } catch (e) {
      console.warn(`your appid: ${this.app_id} load DevTool render fail, fail info: ${e.message}`);
    }
  }
  getStorage() {
    const storage_appid = this.cacheStorgae.getLocalItem(`__applog_open_devtool_web`)
    return storage_appid && parseInt(storage_appid) === this.app_id
  }
  setStorage() {
    this.cacheStorgae.setLocalItem(`__applog_open_devtool_web`, this.app_id)
  }
  loadDevTool() {
    const currentAppHasLoad = this.cacheStorgae.getLocalItem(this.currentAppKey) == 1;
    if (currentAppHasLoad) {
      console.warn(`your appid: ${this.app_id} has load web devtools already, maybe your page has more than two applogsdk and use one appid`);
      return;
    }
    this.loadDebuggerModule();
    this.loadScript(this.loadUrl)
  }
  loadBaseInfo() {
    this.log = [];
    this.event = [];
    this.info = [
      {
        title: '基本信息',
        key: 'base',
        type: 1,
        content: [
          {
            name: 'app_id',
            desc: 'APP_ID',
            value: this.config.app_id
          },
          {
            name: 'channel',
            desc: 'CHANNEL',
            value: this.config.channel
          },
          {
            name: 'domain',
            desc: '上报域名',
            value: this.collect.configManager.getDomain()
          },
          {
            name: 'sdk_version',
            desc: 'SDK版本',
            value: SDK_VERSION,
          },
          {
            name: 'sdk_type',
            desc: 'SDK引入方式',
            value: SDK_TYPE,
          }
        ]
      },
      {
        title: '用户信息',
        key: 'user',
        type: 2,
        content: [
          {
            name: 'uuid',
            desc: 'UUID',
            value: this.collect.configManager.get('user').user_unique_id || '',
          },
          {
            name: 'web_id',
            desc: 'WEB_ID',
            value: this.collect.configManager.get('user').web_id || '',
          }
        ]
      },
      {
        title: '公共参数信息',
        type: 2,
        key: 'common',
        content: [
          {
            name: 'browser',
            desc: '浏览器',
            value: this.collect.configManager.get('browser'),
          },
          {
            name: 'browser_version',
            desc: '浏览器版本',
            value: this.collect.configManager.get('browser_version'),
          },
          {
            name: 'platform',
            desc: '平台',
            value: this.collect.configManager.get('platform'),
          },
          {
            name: 'device_model',
            desc: '设备型号',
            value: this.collect.configManager.get('device_model'),
          },
          {
            name: 'os_name',
            desc: '操作系统',
            value: this.collect.configManager.get('os_name'),
          },
          {
            name: 'os_version',
            desc: '操作系统版本',
            value: this.collect.configManager.get('os_version'),
          },
          {
            name: 'resolution',
            desc: '屏幕分辨率',
            value: this.collect.configManager.get('resolution'),
          },
          {
            name: 'referrer',
            desc: '来源',
            value: this.collect.configManager.get('referrer'),
          },
          {
            name: 'custom',
            desc: '自定义信息',
            value: JSON.stringify(this.collect.configManager.get('custom')),
          }
        ]
      },
      {
        title: '配置信息',
        key: 'config',
        type: 3,
        content: [
          {
            name: 'autotrack',
            desc: '全埋点',
            value: this.config.autotrack ? true : false,
          },
          {
            name: 'stay',
            desc: '停留时长',
            value: this.config.enable_stay_duration ? true : false,
          }
        ]
      },
      {
        title: 'A/B配置信息',
        key: 'ab',
        type: 4,
        content: [
          {
            name: 'ab',
            desc: 'A/B实验',
            value: this.config.enable_ab_test ? true : false,
          }
        ]
      }
    ]
    if (this.config.enable_ab_test) {
      const ab = this.getInfo('ab');
      const content = [
        {
          name: 'ab',
          desc: 'A/B实验',
          value: this.config.enable_ab_test ? true : false,
        },
        {
          name: 'vid',
          desc: '已曝光VID',
          value: this.collect.configManager.getAbVersion()
        },
        {
          name: 'ab_domain',
          desc: 'A/B域名',
          value: this.config.ab_channel_domain || decodeUrl(AB_DOMAINS[this.config.channel])
        },
        {
          name: 'all_values',
          desc: '全部配置',
          value: this.collect.configManager.getAbCache()
        },
      ]
      ab.content = content;
      this.setInfo('ab', ab)
    }
    if (this.config.enable_native || this.config.Native) {
      const native = {
        title: '客户端信息',
        type: 3,
        content: [
          {
            name: 'native',
            desc: '是否打通',
            value: this.collect.bridgeReport ? true : false,
          }
        ]
      }
      this.setInfo('native', native)
    }
    if (SDK_VERSION.includes('tob')) {
      const user = this.getInfo('user')
      user.content.push({
        name: 'sid',
        desc: 'DISS'.split('').reverse().join(''),
        value: '点击获取'
      })
      this.setInfo('user', user)
    }
  }
  getInfo(key: string) {
    let current = null
    this.info.forEach(item => {
      if (item.key === key) {
        current = item;
      }
    })
    return current
  }
  setInfo(key: string, data: any) {
    let hasKey = false
    this.info.forEach(item => {
      if (item.key === key) {
        hasKey = true
        item = data;
      }
    })
    if (!hasKey) {
      this.info.push(data)
    }
  }
  getSecondInfo(key: string, valueKey: string) {
    const data = this.getInfo(key)
    let current = null
    data.content.forEach(item => {
      if (item.name === valueKey) {
        current = item
      }
    })
    return current
  }
  setSecondInfo(key: string, valueKey: string, value: any) {
    const data = this.getInfo(key)
    let contentHasKey = false
    data.content.forEach(item => {
      if (item.name === valueKey) {
        item.value = value
        contentHasKey = true
      }
    })
    if (!contentHasKey) {
      const newContent = {
        name: valueKey,
        value,
        desc: valueKey.toLocaleUpperCase()
      }
      data.content.push(newContent)
    }
    this.setInfo(key, data)
  }
  loadHook() {
    this.collect.on(DebuggerMesssge.DEBUGGER_MESSAGE, (data => {
      switch (data.type) {
        case DebuggerMesssge.DEBUGGER_MESSAGE_SDK:
          const logObj = {
            time: data.time,
            type: data.logType || 'sdk',
            infoType: data.infoType || 'sdk',
            level: data.level,
            name: data.info,
            show: true,
            levelShow: true,
            needDesc: data.data ? true : false,
          }
          if (data.data) {
            logObj['desc'] = {
              content: JSON.stringify(data.data)
            }
          }
          this.updateLog(logObj);
          if (data.secType && data.secType === 'AB') {
            this.setSecondInfo('ab', 'vid', this.collect.configManager.getAbVersion())
            this.setSecondInfo('ab', 'all_values', this.collect.configManager.getAbCache())
          } else if (data.secType === 'USER') {
            // this.setSecondInfo('user', 'uuid', this.collect.configManager.get('user_unique_id'))
            // this.setSecondInfo('user', 'web_id', this.collect.configManager.get('web_id'))
            this.setSecondInfo('user', data.common === 'user_unique_id' ? 'uuid' : data.common, this.collect.configManager.get(data.common))
          } else if (data.secType === 'HEADER') {
            const value = this.collect.configManager.get(data.common)
            this.setSecondInfo('common', data.common, data.common === 'custom' ? JSON.stringify(value) : value)
          }
          this.updateInfo();
          return;
        case DebuggerMesssge.DEBUGGER_MESSAGE_EVENT:
          if (data.data && data.data.length) {
            const events = data.data[0];
            const event = events.events;
            if (!event.length) return;
            event.forEach(item => {
              item['checkShow'] = true;
              item['searchShow'] = true;
              item['focusShow'] = true;
              item['status'] = data.status;
              item['type'] = this.filterEvent.has(item.event) ? 'sdk' : 'cus';
              item['verifyType'] = data.verifyType ? 'verify' : 'no'
              item['info'] = '';
              if (data.status === 'fail') {
                item['info'] = {
                  message: `code: ${data.code}， msg: ${data.msg || data.failType}`
                }
              }
            })
            this.updateEvent(events);
          }

          return;
      }
    }))
  }
  addLintener() {
    // 关闭页面需要移除，不然下次打开就不在加载了
    window.addEventListener('beforeunload', () => {
      this.cacheStorgae.removeLocalItem(this.currentAppKey);
    });
    window.addEventListener('pagehide', () => {
      this.cacheStorgae.removeLocalItem(this.currentAppKey);
    });
    window.addEventListener('message', (messgae: any) => {
      if (messgae && messgae.data && messgae.data.type === 'devtool:web:ready') {
        this.devToolOrigin = messgae.origin;
        this.devToolReady = true;
        if (this.sendAlready) return;
        this.sendData('devtool:web:init', {
          info: this.info,
          log: this.log,
          event: this.event,
          sdk_type: SDK_VERSION.includes('tob') ? 'tob' : 'inner',
          appId: this.app_id
        });
        this.sendAlready = true;
      }
      if (messgae && messgae.data && messgae.data.type === 'devtool:web:ssid') {
        this.collect.getToken(res => {
          this.setSecondInfo('user', 'sid', res.tobid)
          this.updateInfo();
        })
      }
    })
  }
  sendData(type: string, data: any) {
    try {
      const postData: MesType = {
        type: type,
        payload: data
      };
      // (window.opener || window.parent).postMessage(postData, this.devToolOrigin);
      window && window.postMessage(postData, this.devToolOrigin);
    } catch (e) { }
  }
  updateInfo() {
    if (!this.devToolReady) {
      return;
    }
    this.sendData('devtool:web:info', this.info);
  }
  updateLog(logObj: any) {
    if (!this.devToolReady) {
      this.log.push(logObj);
      return;
    }
    this.sendData('devtool:web:log', logObj);
  }
  updateEvent(events: any) {
    if (!this.devToolReady) {
      this.event.push(events);
      return;
    }
    this.sendData('devtool:web:event', events);
  }
  loadDebuggerModule() {
    const debugCss = `#debugger-applog-web {
      position: fixed;
      width: 45px;
      height: 45px;
      background-image: url(${decodeUrl('1fz22z22z1nz21z4mz4bz4bz1jz1dz49z1az1bz1lz49z22z1mz21z4az19z27z22z1cz21z1az1kz4az1az1mz1kz4bz1mz19z1hz4bz21z22z18z22z1gz1az4bz1jz1mz1ez49z21z1bz1iz4bz1az1mz1jz1jz1cz1az22z4bz1bz1cz24z22z1mz1mz1jz4bz18z1nz1nz1jz1mz1ez4az1nz1lz1e')});
      bottom: 5%;
      right: 10%;
      cursor: pointer;
      z-index:100;
      background-size: 45px;
    }`;
    const head = document.head || document.getElementsByTagName('head')[0]
    const style = document.createElement('style')
    style.appendChild(document.createTextNode(debugCss));
    head.appendChild(style)
    const debuggerHtml = `<div id="debugger-applog-web" class="debugger-applog-web"></div>`;
    const debugDiv = document.createElement('div');
    debugDiv.innerHTML = debuggerHtml;
    const debuggerContainer = `<div id="debugger-container" class="debugger-container"></div>`;
    const debugContainerDiv = document.createElement('div');
    debugContainerDiv.innerHTML = debuggerContainer;
    document.getElementsByTagName('body')[0].appendChild(debugDiv);
    document.getElementsByTagName('body')[0].appendChild(debugContainerDiv);
    const debugTool = document.getElementById('debugger-applog-web');
    new DraggableButton(debugTool);
  }
}
