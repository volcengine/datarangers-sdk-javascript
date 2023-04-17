// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.
import { openOverlayer, closeOverlayer } from './layer';
import { AB_DOMAINS } from '../../collect/constant'
import '../../util/url-polyfill'
import { DebuggerMesssge } from '../../collect/hooktype';
import { getIframeUrl, isObject, parseUrlQuery, parseURL, decodeUrl } from '../../util/tool';
import readyToLoadEditor, { loadVisual, loadMuiltlink } from './load';

enum CallbackType {
  Var,
  All,
}

type TABItemValue = string | number | any;
interface IABItem {
  val: TABItemValue;
  vid: string;
}
export interface IABData {
  [key: string]: IABItem;
}
interface ICallback {
  name?: string;
  defaultValue?: any;
  callback: (value: TABItemValue | IABData) => void;
  type: CallbackType;
}
const STORAGE_EXPRIRE = 1 * 30 * 24 * 60 * 60 * 1000;
const API = '/service/2/abtest_config/';
export default class Ab {
  collect: any;
  config: any;
  abOption: any;
  fetchUrl: string;
  reportUrl: string;
  fetchStatus: string = 'no'
  refreshFetchStatus: string = 'complete'
  versions: string[] = [];
  extVersions: string[] = [];
  mulilinkVersions: string[] = [];
  enable_multilink: boolean = false;
  enable_ab_visual: boolean = false;
  editMode: boolean = false;
  callbacks: ICallback[] = [];
  abKey: string;
  cacheStorgae: any;
  data: IABData = null;
  changeListener: Map<any, any> = new Map();
  fetch: any;
  readyStatus: boolean = false;
  types: any
  ab_cross: boolean
  ab_cookie_domain: string
  exposureCache: any[] = [];
  exposureLimit: number;
  ab_batch_time: number
  reportTimeout: any
  apply(collect: any, config: any) {
    this.collect = collect;
    this.config = config;
    if (!this.config.enable_ab_test) return;
    const { enable_multilink, ab_channel_domain, enable_ab_visual, ab_cross, ab_cookie_domain, disable_ab_reset } = config;
    const abDomain = ab_channel_domain || decodeUrl(AB_DOMAINS[config.channel || 'cn']);
    const { storage, fetch } = collect.adapters;
    this.cacheStorgae = new storage(false);
    this.fetch = fetch;
    this.enable_multilink = enable_multilink;
    this.enable_ab_visual = enable_ab_visual;
    this.abKey = `__tea_sdk_ab_version_${config.app_id}`;
    this.ab_cross = ab_cross;
    this.ab_cookie_domain = ab_cookie_domain || '';
    this.fetchUrl = `${abDomain}${API}`;
    this.reportUrl = `${collect.configManager.getUrl('event')}`;
    this.exposureLimit = config.exposure_limit || 20;
    this.ab_batch_time = config.ab_batch_time || 500;
    const { Types } = this.collect;
    this.types = Types
    this.collect.on(Types.TokenChange, (tokenInfo: { type: string, id: string }) => {
      if (disable_ab_reset) return;
      if (tokenInfo.type !== 'uuid') return;
      if (!this.readyStatus) return;
      this.clearCache();
      this.fetchAB();
    });
    this.collect.on(Types.TokenReset, () => {
      if (disable_ab_reset) return;
      if (!this.readyStatus) return;
      this.clearCache();
      this.fetchAB();
    });
    this.collect.on(Types.AbVar, ({ name, defaultValue, callback }) => {
      this.getVar(name, defaultValue, callback);
    });

    this.collect.on(Types.AbAllVars, (callback) => {
      this.getAllVars(callback);
    });

    this.collect.on(Types.AbConfig, ({ params, callback }) => {
      this.getABconfig(params, callback);
    });

    this.collect.on(Types.AbExternalVersion, (vids: string) => {
      this.setExternalAbVersion(vids);
    });
    this.collect.on(Types.AbOpenLayer, () => {
      this.openOverlayer();
    });
    this.collect.on(Types.AbCloseLayer, () => {
      this.closeOverlayer();
    });

    this.collect.on(
      Types.AbVersionChangeOn,
      (cb: (versions: string) => void) => {
        this.changeListener.set(cb, cb);
      }
    );

    this.collect.on(
      Types.AbVersionChangeOff,
      (cb: (versions: string) => void) => {
        if (this.changeListener.get(cb)) {
          this.changeListener.delete(cb);
        }
      }
    );
    this.loadMode();
    (this.enable_ab_visual || this.enable_multilink) &&
      this.openOverlayer(this.config.multilink_timeout_ms || 500);
    this.checkLocal();
    this.ready('ab');
    if (!this.readyStatus) {
      this.fetchAB();
      this.readyStatus = true;
    }
    this.collect.emit(Types.AbReady)
  }
  ready(name: string) {
    this.collect.set(name);
    if (this.collect.hook._hooksCache.hasOwnProperty(name)) {
      const emits = this.collect.hook._hooksCache[name];
      if (!Object.keys(emits).length) return;
      for (let key in emits) {
        if (emits[key].length) {
          emits[key].forEach(item => {
            this.collect.hook.emit(key, item);
          })
        }
      }
    }
  }
  loadMode() {
    const name = getIframeUrl();
    let editMode = '';
    if (name) {
      const { scenario, href } = name;
      if (scenario) {
        this.editMode = true;
        editMode = scenario;
      } else if (
        href &&
        (href.indexOf('datatester') !== -1 ||
          href.indexOf('visual-editor') !== -1)
      ) {
        this.editMode = true;
        editMode = 'visual-editor';
      }
    }
    if (this.enable_ab_visual) {
      readyToLoadEditor(this.collect, this.config);
      if (editMode === 'visual-editor') {
        this.collect.destoryInstace();
        return;
      }
    }
    if (this.enable_multilink) {
      loadMuiltlink(this.collect, this.config);
    }
  }
  checkLocal() {
    const { ab_version, ab_ext_version, ab_version_multilink, data } = this.getABCache();
    const mulilinkUrlVid = this.checkFromUrl()
    if (mulilinkUrlVid) {
      this.mulilinkVersions.push(mulilinkUrlVid)
    } else {
      this.mulilinkVersions = ab_version_multilink || [];
    }
    this.extVersions = ab_ext_version || [];
    this.versions = ab_version || [];
    this.data = data;
    let vids = this.versions.concat(this.extVersions);
    if (this.enable_multilink) {
      vids = vids.concat(this.mulilinkVersions)
    }
    this.configVersions(vids.join(','));
  }
  checkFromUrl() {
    const urlQueryObj = parseUrlQuery(window.location.href)
    if (urlQueryObj && urlQueryObj['vid']) {
      return urlQueryObj['vid']
    }
    return ''
  }
  updateVersions() {
    let versions = this.extVersions.length
      ? this.versions.concat(this.extVersions)
      : this.versions;
    if (this.enable_multilink) {
      versions = versions.concat(this.mulilinkVersions)
    }
    this.configVersions(versions.join(','));
    this.updateABCache();
    this.changeListener.size > 0 &&
      this.changeListener.forEach((listener) => {
        if (typeof listener === 'function') {
          listener(versions);
        }
      });
  }
  configVersions(vids: string) {
    this.collect.configManager.setAbVersion(vids)
  }
  getVar(
    name: string,
    defaultValue: any,
    callback: (value: TABItemValue) => void
  ) {
    if (!name) {
      throw new Error('variable must not be empty');
    }
    if (defaultValue === undefined) {
      throw new Error('variable no default value');
    }
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function');
    }
    const callbackObj = {
      name,
      defaultValue,
      callback,
      type: CallbackType.Var,
    };
    if (this.fetchStatus === 'complete' && this.refreshFetchStatus === 'complete') {
      this.getRealVar(callbackObj, name);
    } else {
      this.callbacks.push(callbackObj);
    }
  }
  getRealVar(item: ICallback, key: string) {
    const { name, defaultValue, callback } = item;
    const { data } = this;
    if (!data) {
      callback(defaultValue);
      return;
    }
    if (isObject(data[name])) {
      const { vid } = data[name];
      if (key === '$ab_url') {
        if (!this.mulilinkVersions.includes(vid)) {
          this.mulilinkVersions.push(vid);
        }
      } else {
        if (!this.versions.includes(vid)) {
          this.versions.push(vid);
        }
      }
      this.updateVersions();
      this.fechEvent(vid, key, defaultValue);
      callback(data[name].val);
      this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, secType: 'AB', info: `SDK 曝光了实验${name}`, level: 'info', time: Date.now(), data: data[name] })
      return;
    }
    this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, secType: 'AB', info: 'SDK 调用getVar', level: 'info', time: Date.now(), data: defaultValue })
    callback(defaultValue);
  }
  getAllVars(callback: (data: IABData) => void) {
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function');
    }
    const callbackObj = {
      callback,
      type: CallbackType.All,
    };
    if (this.fetchStatus === 'complete' && this.refreshFetchStatus === 'complete') {
      this.getRealAllVars(callbackObj);
    } else {
      this.callbacks.push(callbackObj);
    }
  }
  getRealAllVars(item: ICallback) {
    const { callback } = item;
    callback(this.data ? JSON.parse(JSON.stringify(this.data)) : {});
    this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, secType: 'AB', info: 'SDK 调用getAllVars', level: 'info', time: Date.now(), data: this.data })
  }
  fechEvent(vid: string, key: string, ab_url?: string) {
    try {
      if (this.config.disable_track_event) return;
      if (!vid) return;
      let { header, user } = this.collect.configManager.get();
      const cache = this.getABCache()
      if (cache && cache.uuid && cache.uuid !== user.user_unique_id) return;
      const event = {
        event: 'abtest_exposure',
        ab_sdk_version: `${vid}`,
        params: JSON.stringify({
          app_id: this.config.appId,
          ab_url: key === '$ab_url' ? ab_url : window.location.href,
        }),
        local_time_ms: Date.now(),
      };
      header['custom'] = JSON.stringify(header['custom']);
      const abData = {
        events: [event],
        user,
        header,
      };
      if (key === '$ab_url') {
        if (window.navigator.sendBeacon) {
          window.navigator.sendBeacon(this.reportUrl, JSON.stringify([abData]));
        } else {
          this.reportExposure(abData);
        }
      } else {
        this.reportExposure(abData);
      }
    } catch (e) {
      this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, info: '发生了异常', level: 'error', time: Date.now(), data: e.message });
    }
  }
  reportExposure(abData: any) {
    this.exposureCache.push(abData);
    if (this.reportTimeout) {
      clearTimeout(this.reportTimeout);
    }
    if (this.exposureCache.length >= this.exposureLimit) {
      this.report();
    } else {
      this.reportTimeout = setTimeout(() => {
        this.report();
        clearTimeout(this.reportTimeout);
      }, this.ab_batch_time)
    }
  }
  report() {
    const encodeData = this.collect.cryptoData(this.exposureCache);
    this.fetch(this.reportUrl, encodeData, 100000, false, () => { }, () => { }, '', 'POST', this.config.enable_encryption, this.config.encryption_header)
    this.exposureCache.forEach(item => {
      this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_EVENT, info: '埋点上报成功', time: Date.now(), data: [item], code: 200, status: 'success' })
    })
    this.exposureCache = [];
  }
  setExternalAbVersion(vid: string) {
    this.extVersions = [vid];
    this.updateVersions()
  }
  getABconfig(params: any, callback: any) {
    var keys = Object.keys(params);
    if (keys && keys.length) {
      this.collect.configManager.set(params);
    }
    this.fetchAB(callback);
  }
  get(key: string) {
    if (this.ab_cross) {
      const ab_cookie = this.cacheStorgae.getCookie(key, this.ab_cookie_domain);
      return ab_cookie ? JSON.parse(ab_cookie) : null;
    } else {
      return this.cacheStorgae.getItem(key);
    }
  }
  set(key: string, data: any) {
    if (this.ab_cross) {
      this.cacheStorgae.setCookie(key, data, STORAGE_EXPRIRE, this.ab_cookie_domain);
    } else {
      this.cacheStorgae.setItem(key, data);
    }
    this.collect.configManager.setAbCache(data);
  }
  getABCache(key?: string) {
    let data = {
      ab_version: [],
      ab_ext_version: [],
      ab_version_multilink: [],
      data: null,
      timestamp: +new Date(),
      uuid: ''
    };
    data = this.get(this.abKey) || data;
    if (Date.now() - data.timestamp >= STORAGE_EXPRIRE) {
      this.cacheStorgae.removeItem(this.abKey);
      return null;
    }
    if (key) {
      return data[key];
    }
    return data;
  }
  updateABCache() {
    const cache = this.getABCache();
    cache.ab_version_multilink = this.mulilinkVersions;
    cache.ab_ext_version = this.extVersions;
    cache.ab_version = this.versions;
    cache.timestamp = Date.now();
    this.set(this.abKey, cache);
  }
  setAbCache(uuid?: string) {
    const cache = this.getABCache();
    cache.data = this.data;
    cache.uuid = uuid
    cache.timestamp = Date.now();
    this.set(this.abKey, cache);
  }
  clearCache() {
    this.refreshFetchStatus = 'ing'
    this.data = {};
    this.extVersions = [];
    this.mulilinkVersions = [];
    this.versions = [];
    this.collect.configManager.clearAbCache();
  }
  openOverlayer(timeout?: number) {
    openOverlayer();
    if (timeout) {
      const layer = setTimeout(() => {
        this.closeOverlayer();
        clearTimeout(layer);
      }, timeout);
    }
  }
  closeOverlayer() {
    closeOverlayer();
  }
  fetchComplete(abData: any, uuid: string) {
    if (abData && Object.prototype.toString.call(abData) == '[object Object]') {
      this.data = abData;
      this.setAbCache(uuid)
      const versions = [];
      Object.keys(abData).forEach((key) => {
        const { vid } = abData[key];
        if (vid) {
          versions.push(vid);
        }
      });
      this.versions = this.versions.filter((vid) => versions.includes(vid));
      const { $ab_url, $ab_modification } = abData;
      if ($ab_modification && $ab_modification.val && this.enable_ab_visual) {
        if (this.collect.destroyInstance) return;
        this.getVar('$ab_modification', window.location.href, () => {
          loadVisual($ab_modification.val);
          this.closeOverlayer();
        });
      } else if ($ab_url && this.enable_multilink) {
        this.mulilinkVersions = this.mulilinkVersions.filter((vid) => versions.includes(vid));
        const { val, vid } = $ab_url;
        if (val && vid) {
          this.getVar('$ab_url', val, () => {
            if (this.editMode) return;
            if (val !== window.location.href) {
              setTimeout(() => {
                if (this.collect.destroyInstance) return;
                let jump = `${val}`;
                jump = jump.indexOf('http') === -1 ? `https://${jump}` : jump;
                const newhost = parseURL(jump).host
                try {
                  const urlObj = new URL(jump)
                  if (newhost !== location.host) {
                    // 跳转的是一个新域名
                    urlObj.searchParams.append('vid', vid)
                  } else {
                    // 不同的域名不能replace
                    window.history.replaceState('', '', jump);
                  }
                  window.location.href = urlObj.href;
                } catch (e) {
                  window.location.href = jump;
                }
              }, 100);
            } else {
              this.closeOverlayer();
            }
          });
        }
      }
      this.updateVersions();
    } else {
      this.closeOverlayer();
    }
    this.callbacks.forEach((item) =>
      this[item.type === CallbackType.Var ? 'getRealVar' : 'getRealAllVars'](
        item,
        ''
      )
    );
    this.callbacks = [];
  }
  fetchAB(callback?: any) {
    const env = this.collect.configManager.get();
    const { header, user } = env;
    if (this.config.enable_anonymousid) {
      delete user.web_id;
    }
    const fetchUuid = user.user_unique_id;
    const requestBody = {
      header: {
        aid: this.config.app_id,
        ...(user || {}),
        ...(header || {}),
        ab_sdk_version: this.collect.configManager.getAbVersion(),
        ab_url: window.location.href
      },
    }
    this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, info: 'SDK 发起AB实验请求', level: 'info', logType: 'fetch', time: Date.now(), data: requestBody })
    const cryptoData = this.collect.cryptoData(requestBody)
    this.fetch(
      this.fetchUrl, cryptoData,
      this.config.ab_timeout || 3000,
      false,
      (response) => {
        this.fetchStatus = 'complete';
        this.refreshFetchStatus = 'complete';
        // let aa = {
        //   message: "success",
        //   data: {
        //     abcdefg: { val: "gss", vid: "11407" },
        //     erf: { val: 'name', vid: "22" },
        //     hhhhh: { val: 'age', vid: "33" },
        //     juuioh: { val: 'sex', vid: "44" },
        //     $ab_url: { val: 'http://0.0.0.0:8898/index_cdn_5.html?s=2', vid: '0000' }
        //   }
        // }
        // if (env.user.user_unique_id === 'bbbb') {
        //   aa.data.abcdefg.vid = '11408'
        // } else if (env.user.user_unique_id === 'cccc') {
        //   aa.data.abcdefg.vid = '11409'
        // }
        const { data, message } = response; // 解析出code
        if (message === 'success') {
          this.fetchComplete(data, fetchUuid);
          callback && callback(data);
        } else {
          this.fetchComplete(null, fetchUuid);
          callback && callback(null);
        }
        this.collect.emit(this.types.AbComplete, data)
        this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, secType: 'AB', info: 'AB实验请求成功', level: 'info', logType: 'fetch', time: Date.now(), data: data })
      },
      () => {
        this.fetchStatus = 'complete';
        this.refreshFetchStatus = 'complete';
        this.fetchComplete(null, fetchUuid);
        callback && callback(null);
        this.collect.emit(this.types.AbTimeout)
        this.collect.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, secType: 'AB', info: 'AB实验请求网络异常', level: 'error', logType: 'fetch', time: Date.now() })
      },
      '', '', this.config.enable_encryption, this.config.encryption_header
    );
  }
  filterUrl(url: string) {
    try {
      let _reg = '';
      if (url.indexOf('&multilink=true') !== -1) {
        _reg = '&multilink=true[\x00-\xff]*';
      } else if (url.indexOf('?multilink=true') !== -1) {
        _reg = '\\?multilink=true[\x00-\xff]*';
      }
      let reg = new RegExp(_reg, 'g');
      url = url.replace(reg, '');
    } catch (e) { }
    return url;
  }
}
