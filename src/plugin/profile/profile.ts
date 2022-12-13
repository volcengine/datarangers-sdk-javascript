// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import { DebuggerMesssge } from '../../collect/hooktype'
import EventCheck from '../check/check'

interface ProfileParams {
  [key: string]: string | number | Array<any>;
}

interface ProfileIncrementParams {
  [key: string]: number;
}
export default class Profile {
  collect: any
  config: any
  cache: Record<string, any>
  duration: number
  reportUrl: string
  fetch: any
  eventCheck: any
  apply(collect: any, config: any) {
    this.collect = collect
    this.config = config
    this.duration = 60 * 1000
    this.reportUrl = `${collect.configManager.getDomain()}/profile/list`
    const { Types } = collect
    const { fetch } = collect.adapters
    this.eventCheck = new EventCheck(collect, config)
    this.fetch = fetch
    this.cache = {}
    this.collect.on(Types.ProfileSet, (params) => {
      this.setProfile(params);
    });
    this.collect.on(Types.ProfileSetOnce, (params) => {
      this.setOnceProfile(params);
    });
    this.collect.on(Types.ProfileUnset, (key) => {
      this.unsetProfile(key);
    });
    this.collect.on(Types.ProfileIncrement, (params) => {
      this.incrementProfile(params);
    });
    this.collect.on(Types.ProfileAppend, (params) => {
      this.appendProfile(params);
    });
    this.collect.on(Types.ProfileClear, () => {
      this.cache = {};
    });
    this.ready(Types.Profile)
  }
  ready(name: string) {
    this.collect.set(name)
    if (this.collect.hook._hooksCache.hasOwnProperty(name)) {
      const emits = this.collect.hook._hooksCache[name]
      if (!Object.keys(emits).length) return
      for (let key in emits) {
        if (emits[key].length) {
          emits[key].forEach(item => {
            this.collect.hook.emit(key, item);
          })
        }
      }
    }
  }
  report(eventName: string, params: any = {}) {
    try {
      if (this.config.disable_track_event) return;
      let profileEvent = []
      profileEvent.push(this.collect.processEvent(eventName, params))
      let data = this.collect.eventManager.merge(profileEvent, true)
      this.fetch(this.reportUrl, data)
      this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_EVENT, info: '埋点上报成功', time: Date.now(), data: data, code: 200, status: 'success' })
    } catch (e) {
      this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, info: '发生了异常', level: 'error', time: Date.now(), data: e.message });
    }
  }
  setProfile(params: ProfileParams): void {
    const result = this.formatParams(params);
    if (!result || !Object.keys(result).length) {
      return;
    }
    this.pushCache(result);
    this.report('__profile_set', {
      ...result,
      profile: true
    });
  }
  setOnceProfile(params: ProfileParams) {
    const result = this.formatParams(params, true);
    if (!result || !Object.keys(result).length) {
      return;
    }
    this.pushCache(result);
    this.report('__profile_set_once', {
      ...result,
      profile: true
    });
  }
  incrementProfile(params: ProfileIncrementParams) {
    if (!params) {
      console.warn('please check the params, must be object!!!')
      return;
    }
    this.report('__profile_increment', {
      ...params,
      profile: true
    });
  }
  unsetProfile(key: string) {
    if (!key) {
      console.warn('please check the key, must be string!!!')
      return;
    }
    let unset = {}
    unset[key] = '1'
    this.report('__profile_unset', {
      ...unset,
      profile: true
    });
  }
  appendProfile(params: ProfileParams) {
    if (!params) {
      console.warn('please check the params, must be object!!!')
      return;
    }
    let _params = {}
    for (let key in params) {
      if (typeof params[key] !== 'string' && Object.prototype.toString.call(params[key]).slice(8, -1) !== 'Array') {
        console.warn(`please check the value of param: ${key}, must be string or array !!!`)
        continue;
      } else {
        _params[key] = params[key]
      }
    }
    const keys = Object.keys(_params)
    if (!keys.length) return
    this.report('__profile_append', {
      ..._params,
      profile: true
    });
  }
  pushCache(params: ProfileParams) {
    Object.keys(params).forEach((key) => {
      this.cache[key] = {
        val: this.clone(params[key]),
        timestamp: Date.now(),
      };
    });
  }
  formatParams(params: ProfileParams, once: boolean = false): ProfileParams | undefined {
    try {
      if (
        !params ||
        Object.prototype.toString.call(params) !== '[object Object]'
      ) {
        console.warn('please check the params type, must be object !!!')
        return;
      }
      let _params = {}
      for (let key in params) {
        if (typeof params[key] === 'string' || typeof params[key] === 'number' || Object.prototype.toString.call(params[key]).slice(8, -1) === 'Array') {
          _params[key] = params[key]
        } else {
          console.warn(`please check the value of params:${key}, must be string,number,Array !!!`)
          continue;
        }
      }
      const keys = Object.keys(_params);
      if (!keys.length) {
        return;
      }
      const now = Date.now();
      return keys.filter((key) => {
        const cached = this.cache[key];
        if (once) {
          if (cached) return false;
          return true;
        } else {
          if (cached && this.compare(cached.val, params[key]) && (now - cached.timestamp < this.duration)) {
            return false;
          }
          return true;
        }
      })
        .reduce((res, current) => {
          res[current] = _params[current];
          return res;
        }, {});
    } catch (e) {
      this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, info: '发生了异常', level: 'error', time: Date.now(), data: e.message });
      console.log('error')
    }
  }
  // 对比新老值
  compare(newValue: any, oldValue: any) {
    try {
      return JSON.stringify(newValue) === JSON.stringify(oldValue);
    } catch (e) {
      this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, info: '发生了异常', level: 'error', time: Date.now(), data: e.message });
      return false;
    }

  }
  clone(value: any) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (e) {
      this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, info: '发生了异常', level: 'error', time: Date.now(), data: e.message });
      return value;
    }
  }
  unReady() {
    console.warn('sdk is not ready, please use this api after start')
    return;
  }
}