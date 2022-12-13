// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.
export default class EventCheck {
  regStr: RegExp
  eventNameWhiteList: string[]
  paramsNameWhiteList: string[]
  collector: any
  config: any
  constructor(collect: any, config: any) {
    this.collector = collect;
    this.config = config;
    this.eventNameWhiteList = [
      '__bav_page',
      '__bav_beat',
      '__bav_page_statistics',
      '__bav_click',
      '__bav_page_exposure',
      '_be_active'
    ]
    this.paramsNameWhiteList = [
      '$inactive',
      '$inline',
      '$target_uuid_list',
      '$source_uuid',
      '$is_spider',
      '$source_id',
      '$is_first_time',
      '$user_unique_id_type',
      '_staging_flag'
    ]
    this.regStr = new RegExp('^[a-zA-Z0-9][a-z0-9A-Z_.-]{1,255}$');
  }
  // 事件名校验
  checkVerify(eventInfo: any): boolean {
    if (!eventInfo || !eventInfo.length) return false;
    const arr = eventInfo[0];
    if (!arr) return false;
    const events = arr.events;
    const headers = arr.header;
    if (!events || !events.length) return false;
    let checkStatus = true;
    events.forEach(event => {
      if (!this.checkEventName(event.event)) {
        checkStatus = false;
        event.checkEvent = `事件名不能以 $ or __开头`;
      }
      if (!this.checkEventParams(event.params)) {
        checkStatus = false;
        event.checkParams = `属性名不能以 $ or __开头`;
      }
    })
    if (!this.checkEventParams(headers)) {
      checkStatus = false;
    }
    return checkStatus;
  }
  checkEventName(eventName: string): boolean {
    if (!eventName) return false;
    return this.calculate(eventName, 'event');
  }
  checkEventParams(params: any): boolean {
    let _params = params
    if (typeof params === 'string') {
      _params = JSON.parse(_params);
    }
    let paramStatus = true;
    if (!Object.keys(_params).length) return paramStatus;
    for (let key in _params) {
      if (this.calculate(key, 'params')) {
        if (typeof _params[key] === 'string' && _params[key].length > 1024) {
          console.warn(`params: ${key} can not over 1024 byte, please check;`);
          paramStatus = false;
          break;
        }
        continue;
      }
      paramStatus = false;
      break;
    }
    return paramStatus;
  }
  calculate(name: string, type: string): boolean {
    const whiteList = type === 'event' ? this.eventNameWhiteList : (type === 'params' ? this.paramsNameWhiteList : []);
    if (whiteList.indexOf(name) !== -1) return true;
    if (new RegExp('^\\$').test(name) || new RegExp('^__').test(name)) {
      console.warn(`${type} name: ${name} can not start with $ or __, pleace check;`);
      return false;
    }
    return true;
  }
}