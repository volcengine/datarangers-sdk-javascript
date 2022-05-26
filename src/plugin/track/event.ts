import getElementData from './element'
import { ignore } from './dom'
import { ParamsStruct } from './type'


export type EventType = 'bav2b_click' | 'bav2b_change' | 'bav2b_submit' | 'bav2b_impr'
export interface IGNORE {
  text?: boolean
}

function getEventData(event, e, element:HTMLElement, options: any, ignore?:IGNORE): ParamsStruct{
  return {
    event,
    ...getElementData(e, element, options, ignore),
    is_html:1,
    page_key: window.location.href,
    page_title: document.title
  }
}


function getExtraEventData(event, element: HTMLInputElement): Object {
  try {
    if (event === 'bav2b_change') {
      if (element.hasAttribute('data-tea-track')) {
        return {value: element.value}
      }
      return {}
    }
  } catch (err) {
    return {}
  }
}

export default class EventHandle {
  eventName: any
  ignore: IGNORE = { text: false }
  initConfig: any
  options: any
  constructor(initConfig: any, options: any) {
    this.initConfig = initConfig
    this.options = options
    this.eventName = options && options.custom === 'tea' ? {
      click: '__bav_click',
      page: '__bav_page',
      beat: '__bav_beat',
      static: '__bav_page_statistics'
    } : {
      click: 'bav2b_click',
      page: 'bav2b_page',
      beat: 'bav2b_beat',
      static: 'bav2b_page_statistics'
    }
    if (options && options.text === false) {
      this.ignore.text = true
    }
  }
  handleEvent(e, eventType): ParamsStruct {
    try {
      if (ignore(e.target)) {
        return null
      }
      let event = 'bav2b_click'
      switch (eventType) {
        case 'click':
            event = this.eventName['click']
            return getEventData(event, e, e.target, this.options, this.ignore)
        case 'change':
            event = 'bav2b_change'
            return {...getEventData(event, e, e.target, this.options), ...getExtraEventData(event, e.target)}
        case 'submit':
            event = 'bav2b_submit'
            return getEventData(event, e, e.target, this.options)
      }
    } catch(err) {
      console.error(err)
      return null
    }
  }

  handleViewEvent(data:any) {
    data.event = this.eventName['page']
    data.page_title = document.title
    data.page_total_width = window.innerWidth
    data.page_total_height = window.innerHeight
    try {
      const cache = window.sessionStorage.getItem('_tea_cache_duration')
      if (cache) {
        const duration = JSON.parse(cache)
        data.refer_page_duration_ms = duration ? duration.duration : ''
        data.refer_page_title = duration ? duration.page_title : ''
      } else {
        data.refer_page_duration_ms = ''
        data.refer_page_title = ''
      }
      data.scroll_width = document.documentElement.scrollLeft ? document.documentElement.scrollLeft + window.innerWidth : window.innerWidth
      data.scroll_height = document.documentElement.scrollTop ? document.documentElement.scrollTop + window.innerHeight : window.innerHeight
      data.page_start_ms = window.performance.timing.navigationStart
    } catch(e) {
      console.log(`page event error ${JSON.stringify(e)}`)
    }
    return data
  }
  handleStatisticsEvent(data: any) {
    let _data = {}
    _data['event'] = this.eventName['static']
    _data['is_html'] = 1
    _data['page_key'] = location.href
    _data['refer_page_key'] = document.referrer || ''
    _data['page_title'] = document.title
    _data['page_manual_key'] = this.initConfig.autotrack.page_manual_key || ''
    _data['refer_page_manual_key'] = ''
    try {
      const { lcp } = data
      const timing = window.performance.timing
      let init_cos = timing.loadEventEnd - timing.navigationStart
      _data['page_init_cost_ms'] = parseInt(lcp || (init_cos > 0 ? init_cos : 0))
      _data['page_start_ms'] = timing.navigationStart
    } catch(e) {
      console.log(`page_statistics event error ${JSON.stringify(e)}`)
    }
    return _data
  }
  handleBeadtEvent(data: any) {
    data.event = this.eventName['beat']
    data.page_key = window.location.href
    data.is_html = 1
    data.page_title = document.title
    data.page_manual_key = this.initConfig.autotrack.page_manual_key || ''
    try {
      data.page_viewport_width = window.innerWidth
      data.page_viewport_height = window.innerHeight
      data.page_total_width = document.documentElement.scrollWidth
      data.page_total_height = document.documentElement.scrollHeight
      data.scroll_width = document.documentElement.scrollLeft + window.innerWidth
      data.scroll_height = document.documentElement.scrollTop + window.innerHeight
      data.since_page_start_ms = Date.now() - window.performance.timing.navigationStart
      data.page_start_ms = window.performance.timing.navigationStart
    } catch(e) {
      console.log(`beat event error ${JSON.stringify(e)}`)
    }
    return data
  }
}

