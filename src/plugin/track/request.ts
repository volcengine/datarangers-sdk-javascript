

// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import { EventInfo } from './type'

export type RequestOptions = {
  headers?: RequestHeaders,
  body?: string,
  cache?: string,
  credentials?: string,
  method?: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH',
  mode?: string,
  redirect?: string,
  referrer?: string
}

export type RequestHeaders = {
  'content-type'?: string,
  'user-agent'?: string,
}



class Request {
  logFunc: any
  logFuncBecon: any
  collect: any
  constructor(collect: any) {
    this.collect = collect
  }
  send(eventInfo: EventInfo, data: any) {
    const event = data['event']
    delete data['event']
    if (eventInfo && eventInfo.eventSend === 'becon') {
      this.collect.beconEvent(event, data)
    } else {
      this.collect.event(event, data)
    }
  }

  get(url: string, options: RequestOptions) {
    const reqOptions: RequestOptions = {
      headers: { 'content-type': 'application/json' },
      method: 'GET'
    }
    const myOptions: Object = Object.assign(reqOptions, options)
    fetch(url, myOptions)
  }

  post(url: string, options: RequestOptions) {
    const reqOptions: RequestOptions = {
      headers: { 'content-type': 'application/json' },
      method: 'POST'
    }
    const myOptions: Object = Object.assign(reqOptions, options)
    fetch(url, myOptions)
  }
}

export default Request
