

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
  eventNameList: string[]
  collect: any
  constructor(collect: any) {
    this.collect = collect
    this.eventNameList = [
      'report_click_event',
      'report_change_event',
      'report_submit_event',
      'report_exposure_event',
      'report_page_view_event',
      'report_page_statistics_event',
      'report_beat_event'
    ]
  }
  send(_eventInfo: EventInfo, _data: any) {
    const { eventSend } = _eventInfo
    const event = _data['event']
    delete _data['event']
    if (eventSend && eventSend === 'becon') {
      this.collect.beconEvent(event, _data)
    } else {
      this.collect.event(event, _data)
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
