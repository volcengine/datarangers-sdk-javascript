// 通用请求管理
import { IInitParam, EventParams } from '../../../types/types'
import Collector from '../../collect/collect';
import { isIE89, isIE7 } from '../../util/tool'
import Types, { DebuggerMesssge } from '../../collect/hooktype';

const isSupportBeacon = () => {
  if (window.navigator && window.navigator.sendBeacon) {
    return true
  } else {
    return false
  }
}


interface RequestOptions {
  url: string,
  data?: any,
  method?: string,
  success?: Function,
  fail?: Function,
  timeout?: number,
  useBeacon?: boolean,
  withCredentials?: boolean,
  app_key?: string,
  forceXhr?: boolean,
  encryption?: boolean,
  encryption_header?: string
  status?: string
  type?: string
  zip?: boolean
}
class RequestManager {
  collector: Collector
  config: IInitParam
  errorCode: any
  errorMessage: any
  requestType: string
  supportBeacon: boolean
  customHeader: EventParams
  constructor(collector: Collector, config: IInitParam) {
    this.collector = collector;
    this.config = config;
    this.requestType = config.request_type || 'xhr'
    this.supportBeacon = isSupportBeacon()
    this.errorCode = {
      NO_URL: 4001,
      IMG_ON: 4000,
      IMG_CATCH: 4002,
      BEACON_FALSE: 4003,
      XHR_ERROR: 5002,
      TIMEOUT: 5005,
      FETCH_ERROR: 5006,
    }
    this.errorMessage = {
      BEACON_FALSE: 'xhr sendbeacon error',
      XHR_ERROR: 'xhr request error',
      BEACON: 'xhr sendbeacon error',
      TIMEOUT: 'xhr request timeout',
      FETCH_ERROR: 'fetch network error',
      FETCH_RESPONSE_ERROR: 'fetch response error',
    }
    this.customHeader = config.custom_request_header || {}
    this.collector.on(Types.CustomHeader, (info: EventParams) => {
      this.setRequestHeader(info)
    })
  }
  setRequestHeader(info: EventParams) {
    this.customHeader = Object.assign(this.customHeader, info)
  }
  useFetch(requestOptions: RequestOptions) {
    // 自定义场景，使用fetch
    const { url, data, method, success, fail, status, timeout, useBeacon, encryption, encryption_header } = requestOptions;
    if (window.fetch && typeof Request !== 'undefined') {
      let fetchRequest = {
        method: method || 'POST',
      };
      if (useBeacon) {
        if (!('keepalive' in Request.prototype)) {
          // 支持fetch但不支持keepalive时，离开类的请求使用sendBeacon，且忽略压缩
          this.useSendBeacon(requestOptions);
          return;
        } else {
          const browser = this.collector.configManager.get('browser');
          let browserVersion = this.collector.configManager.get('browser_version');
          browserVersion = browserVersion.split('.');
          if (browser === 'Chrome' && browserVersion.length && browserVersion[0] && Number(browserVersion[0]) < 82) {
            // chrome 82版本以下，options请求也不支持keepalive
            this.useSendBeacon(requestOptions);
            return;
          } else {
            fetchRequest['keepalive'] = true;
          }
        }
      }
      let requestBody = JSON.stringify(data);
      const headers = {
        'Content-Type': 'application/json; charset=utf-8'
      }
      if (encryption && encryption_header) {
        headers['Content-Type'] = `application/octet-stream;tt-data=${encryption_header}`;
      }
      fetchRequest['body'] = requestBody;
      fetchRequest['headers'] = headers;
      let controller = null;
      if (typeof AbortController !== 'undefined') {
        controller = new AbortController();
      } else {
        controller = { signal: null, abort: () => { } }
      }
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);
      if (Object.keys(this.customHeader).length) {
        for (const key in this.customHeader) {
          headers[key] = this.customHeader[key]
        }
      }
      fetchRequest['signal'] = controller.signal;
      const startTime = Date.now();
      try {
        fetch(url, fetchRequest).then(response => {
          if (!response.ok) {
            fail && fail(data, response.status, startTime, response.statusText || this.errorMessage.FETCH_RESPONSE_ERROR);
          }
          return response.json();
        })
          .then(res => {
            clearTimeout(timeoutId);
            success && success(res, data, status, startTime, 200);
          })
          .catch(error => {
            clearTimeout(timeoutId);
            fail && fail(data, this.errorCode.FETCH_ERROR, startTime, error.message || this.errorMessage.FETCH_ERROR);
          })
      } catch (e) {
        this.useXhr(requestOptions);
        this.collector.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, info: 'SDK useFetch 发送请求发生了一些问题', level: 'error', time: Date.now(), data: e.message || 'SDK useFetch has some errors', infoType: 'sdk' });
      }

    } else {
      if (useBeacon) {
        this.useSendBeacon(requestOptions);
      } else {
        this.useXhr(requestOptions);
      }
      console.log('your browser not support fetch, use normal request');
    }
  }
  useSendBeacon(requestOptions: RequestOptions) {
    if (this.supportBeacon) {
      // 使用window.sendbeacon，主要在跳转场景下
      const { url, data, status, success, fail } = requestOptions;
      const startTime = Date.now();
      const reponseStatus = window.navigator.sendBeacon(url, JSON.stringify(data));
      if (reponseStatus) {
        success && success({ e: 0 }, data, status, startTime, 200);
      } else {
        fail && fail(data, this.errorCode.BEACON_FALSE, startTime, this.errorMessage.BEACON_FALSE);
      }
    } else {
      this.useXhr(requestOptions);
    }

  }
  useXhr(requestOptions) {
    // 常规场景，使用xmlhttprequest , 还要兼容低版本IE
    const { url, data, method, success, fail, timeout, withCredentials, encryption, encryption_header, status } = requestOptions;
    try {
      const xhr = new XMLHttpRequest()
      xhr.open(method || 'POST', url, true)
      const startTime = Date.now();
      xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8')

      if (encryption && encryption_header) {
        xhr.setRequestHeader('Content-Type', `application/octet-stream;tt-data=${encryption_header}`)
      } else {
        xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8')
      }

      if (Object.keys(this.customHeader).length) {
        for (const key in this.customHeader) {
          xhr.setRequestHeader(key, this.customHeader[key])
        }
      }
      if (withCredentials) {
        xhr.withCredentials = true
      }
      if (timeout) {
        xhr.timeout = timeout
        xhr.ontimeout = () => {
          fail && fail(data, this.errorCode.TIMEOUT, startTime, this.errorMessage.TIMEOUT)
        }
      }
      xhr.onload = () => {
        if (success) {
          var res = null
          if (xhr.responseText) {
            try {
              res = JSON.parse(xhr.responseText)
            } catch (e) {
              res = {}
            }
            success(res, data, status, startTime, xhr.status)
          } else {
            fail && fail(data, this.errorCode.XHR_ERROR, startTime, this.errorMessage.XHR_ERROR)
          }
        }
      }
      xhr.onerror = () => {
        fail && fail(data, this.errorCode.XHR_ERROR, startTime, this.errorMessage.XHR_ERROR)
        xhr.abort()
      }
      xhr.send(JSON.stringify(data))
    } catch (e) {
      this.collector.emit(DebuggerMesssge.DEBUGGER_MESSAGE, { type: DebuggerMesssge.DEBUGGER_MESSAGE_SDK, info: 'SDK useXhr 发送请求发生了一些问题', level: 'error', time: Date.now(), data: e.message, infoType: 'sdk' });
    }
  }

  useRequest(requestOptions: RequestOptions) {
    const { useBeacon } = requestOptions;

    if (this.config.transport && this.collector.configManager.getEnableClientTransport()) {
      this.useCustomRequest(requestOptions);
      return;
    }
    if (this.requestType === 'fetch') {
      this.useFetch(requestOptions);
      return;
    }
    if (useBeacon) {
      this.useSendBeacon(requestOptions);
      return;
    }
    this.useXhr(requestOptions);
  }

  useCustomRequest(requestOptions: RequestOptions) {
    const { transport } = this.config;
    const { url, data, success, fail } = requestOptions;
    if (transport) {
      try {
        transport.post({
          url: url,
          data: JSON.stringify(data),
          success: (res) => {
            success && success(res, data);
          },
          fail: (err) => {
            fail && fail(err, data);
          },
        });
      } catch (e) {
        this.collector.configManager.setEnableClientTransport(false);
        this.useRequest(requestOptions);
      }
    }
  }
}
export default RequestManager