// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

export type TReceiveMsgCallback = (event: MessageEvent, payload: any) => any;
export interface IDataObj {
  type: string;
  payload: object | [] | string;
}
export interface IDataReceive {
  referrer: string;
  type: string;
  payload: object | [] | string;
  lang?: string;
  appId?: number;
  version?: string;
}
const msgQueueMap: { [msgType: string]: any[] } = {};
const allowdOrigins: string[] = [];

export const addAllowdOrigin = (origin: string[]) => {
  if (origin.length) {
    origin.forEach(originItem => {
      allowdOrigins.push(originItem)
    })
  }
}

export function dispatchMsg(
  event: any,
  type: string,
  payload?: any,
  targetOrigin?: string,
) {
  const win: Window = (event && event.source) || window.opener || window.parent;
  const origin: string = (event && event.origin) || targetOrigin || '*';
  const msg: IDataObj = {
    type,
    payload,
  };
  win.postMessage(JSON.stringify(msg), origin);
}

export function receiveMsg(msgType: string, fn: TReceiveMsgCallback) {
  msgQueueMap[msgType] = msgQueueMap[msgType] || [];
  msgQueueMap[msgType].push(fn);
}

function processMsg(event: MessageEvent) {

  if (allowdOrigins.some(domain => domain === '*') ||
    allowdOrigins.some(domain => event.origin.indexOf(domain) > -1)
  ) {

    let rawData: IDataReceive = event.data;
    if (typeof event.data === 'string') {
      try {
        rawData = JSON.parse(event.data);
      } catch (e) {
        rawData = undefined;
      }
    }
    if (!rawData) {
      return;
    }


    const { type, payload } = rawData;
    if (msgQueueMap[type]) {
      msgQueueMap[type].forEach((fn) => {
        if (typeof fn === 'function') {
          fn(event, payload);
        }
      });
    }

  }
}

export function init(config: any, version: string) {
  const copyConfig = { ...config }
  if (copyConfig['filter']) {
    delete copyConfig['filter'];
  }
  if (typeof copyConfig['autotrack'] === 'object' && copyConfig['autotrack']['collect_url']) {
    delete copyConfig['autotrack']['collect_url']
  }
  (window.opener || window.parent).postMessage({
    type: 'tea:sdk:info',
    config: copyConfig,
    version
  }, '*');
  window.addEventListener('message', processMsg, false);
}
