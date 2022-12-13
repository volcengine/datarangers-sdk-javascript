// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import { parseUrlQuery, decodeUrl } from "../../util/tool"
import Types, { DebuggerMesssge } from '../../collect/hooktype'
import { SDK_VERSION, SDK_TYPE, AB_DOMAINS } from '../../collect/constant'

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
  constructor(collect: any, config: any) {
    this.collect = collect;
    this.config = config;
    this.app_id = config.app_id;
    this.filterEvent = ['__bav_page', '__bav_beat', '__bav_page_statistics', '__bav_click', '__bav_page_exposure', 'bav2b_page',
      'bav2b_beat', 'bav2b_page_statistics', 'bav2b_click', 'bav2b_page_exposure', '_be_active', 'predefine_pageview', '__profile_set',
      '__profile_set_once', '__profile_increment', '__profile_unset', '__profile_append', 'predefine_page_alive', 'predefine_page_close', 'abtest_exposure'];
    this.load();
  }
  loadScript(src: string) {
    try {
      const script = document.createElement('script');
      script.src = src;

      script.onerror = function () {
        console.log('load DevTool render fail');
      };

      script.onload = function () {
        console.log('load DevTool render success');
      };

      document.getElementsByTagName('body')[0].appendChild(script);
    } catch (e) {
      console.log(`devTool load fail, ${e.message}`);
    }

  }
  load() {
    try {
      this.loadBaseInfo();
      this.loadHook();
      const queryObj = parseUrlQuery(window.location.href);
      if (!queryObj['open_devtool_web'] || parseInt(queryObj['app_id']) !== this.app_id) return;
      this.addLintener();
      this.loadDebuggerModule();
      this.loadDevTool();
    } catch (e) {
      console.log(`debug fail, ${e.message}`);
    }
  }
  loadDevTool() {
    this.loadScript(`https://lf3-cdn-tos.bytescm.com/obj/static/log-sdk/collect/devtool/debug-web.js`)
  }
  loadBaseInfo() {
    this.info = [
      {
        title: '基本信息',
        type: 1,
        infoName: {
          app_id: this.config.app_id,
          channel: this.config.channel,
          '上报域名': this.collect.configManager.getDomain(),
          'SDK版本': SDK_VERSION,
          'SDK引入方式': SDK_TYPE,
        }
      },
      {
        title: '用户信息',
        type: 2,
        infoName: {
          uuid: this.collect.configManager.get('user').user_unique_id || '',
          web_id: this.collect.configManager.get('user').web_id || '',
          ssid: '点击获取SSID',
        }
      },
      {
        title: '公共参数信息',
        type: 2,
        infoName: {
          '浏览器': this.collect.configManager.get('browser'),
          '浏览器版本': this.collect.configManager.get('browser_version'),
          '平台': this.collect.configManager.get('platform'),
          '设备型号': this.collect.configManager.get('device_model'),
          '操作系统': this.collect.configManager.get('os_name'),
          '操作系统版本': this.collect.configManager.get('os_version'),
          '屏幕分辨率': this.collect.configManager.get('os_version'),
          '来源': this.collect.configManager.get('referrer'),
          '自定义信息': '',
        }
      },
      {
        title: '配置信息',
        type: 3,
        infoName: {
          '全埋点': this.config.autotrack ? true : false,
          '停留时长': this.config.enable_stay_duration ? true : false,
        }
      },
      {
        title: 'A/B配置信息',
        type: 4,
        infoName: {
          'A/B实验': this.config.enable_ab_test ? true : false,
        },
      },
      {
        title: '客户端信息',
        type: 3,
        infoName: {
          '打通开关': this.config.Native ? true : false,
        }
      }
    ];
    this.log = [];
    this.event = [];
    this.collect.on(Types.Ready, () => {
      this.info[1].infoName.uuid = this.collect.configManager.get('user').user_unique_id;
      this.info[1].infoName.web_id = this.collect.configManager.get('user').web_id;
      this.info[2].infoName['自定义信息'] = JSON.stringify(this.collect.configManager.get('custom'));
      if (this.config.enable_ab_test) {
        this.info[4].infoName['已曝光VID'] = this.collect.configManager.getAbVersion();
        this.info[4].infoName['A/B域名'] = this.config.ab_channel_domain || decodeUrl(AB_DOMAINS[this.config.channel]);
        this.info[4].infoName['全部配置'] = this.collect.configManager.getAbData();
      }
      if (this.config.Native) {
        this.info[5].infoName['是否打通'] = this.collect.bridgeReport ? true : false;
      }
    })
  }
  loadHook() {
    this.collect.on(DebuggerMesssge.DEBUGGER_MESSAGE, (data => {
      switch (data.type) {
        case DebuggerMesssge.DEBUGGER_MESSAGE_SDK:
          const logObj = {
            time: data.time,
            type: data.logType || 'sdk',
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
            this.info[4].infoName['已曝光VID'] = this.collect.configManager.getAbVersion();
            this.info[4].infoName['全部配置'] = this.collect.configManager.getAbData();
          } else if (data.secType === 'USER') {
            this.info[1].infoName['uuid'] = this.collect.configManager.get('user').user_unique_id;
            this.info[1].infoName['web_id'] = this.collect.configManager.get('user').web_id;
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
              item['success'] = data.status;
              item['type'] = this.filterEvent.indexOf(item.event) !== -1 ? 'sdk' : 'cus';
              item['type'] = this.collect.bridgeReport ? 'bridge' : item['type'];
              item['info'] = '';
              if (data.status === 'fail') {
                item['info'] = {
                  message: `code: ${data.code}， msg: ${data.failType}`
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
    window.addEventListener('message', (messgae: any) => {
      if (messgae && messgae.data && messgae.data.type === 'devtool:web:ready') {
        this.devToolOrigin = messgae.origin;
        this.devToolReady = true;
        if (this.sendAlready) return;
        console.log('inittttt')
        this.sendData('devtool:web:init', {
          info: this.info,
          log: this.log,
          event: this.event
        });
        this.sendAlready = true;
      }
      if (messgae && messgae.data && messgae.data.type === 'devtool:web:ssid') {
        this.collect.getToken(res => {
          this.info[1].infoName['ssid'] = res.tobid;
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
      (window.opener || window.parent).postMessage(postData, this.devToolOrigin);
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
      width: 90px;
      height: 30px;
      background: #23c243;
      border-radius: 6px;
      color: #fff;
      font-size: 12px;
      bottom: 5%;
      right: 10%;
      text-align: center;
      line-height: 30px;
      cursor: pointer;
      z-index:100;
    }`;
    const head = document.head || document.getElementsByTagName('head')[0]
    const style = document.createElement('style')
    style.appendChild(document.createTextNode(debugCss));
    head.appendChild(style)
    const debuggerHtml = `<div id="debugger-applog-web" class="debugger-applog-web">AppLog调试</div>`;
    const debugDiv = document.createElement('div');
    debugDiv.innerHTML = debuggerHtml;
    const debuggerContainer = `<div id="debugger-container" class="debugger-container"></div>`;
    // const debuggerContainer = `<iframe src="https://lf3-data.volccdn.com/obj/data-static/log-sdk/collect/devtool/index.html"></div>`;
    const debugContainerDiv = document.createElement('div');
    debugContainerDiv.innerHTML = debuggerContainer;
    document.getElementsByTagName('body')[0].appendChild(debugDiv);
    document.getElementsByTagName('body')[0].appendChild(debugContainerDiv);
    const debugTool = document.getElementById('debugger-applog-web');
    debugTool.addEventListener('click', () => {
      (window.opener || window.parent).postMessage({
        type: 'devtool:web:open-draw',
      }, location.origin);
    })
  }
}
