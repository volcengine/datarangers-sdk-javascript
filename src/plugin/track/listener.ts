// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import { isTrack } from './node'
import { OptionsType, EventConfig } from './type'
import { beforePageUnload } from '../../util/tool'

export default class Listener {
  config: EventConfig
  options: OptionsType
  beatTime: number
  statistics: boolean
  eventHandel: Function
  collect: any
  constructor(options: OptionsType, collect: any, Config: any) {
    this.config = Config.getConfig().eventConfig
    this.collect = collect
    this.options = options
    this.beatTime = options.beat
    this.statistics = false
  }
  init(eventHandel: Function) {
    this.eventHandel = eventHandel
    const mode = this.config.mode
    this.addListener(mode)
  }

  addListener(mode: 'proxy-capturing') {
    // 注册事件捕获
    if (mode === 'proxy-capturing') {
      if (this.config.click) {
        window.document.addEventListener('click', this.clickEvent, true)
      }
      if (this.config.change) {
        window.document.addEventListener('change', this.changeEvent, true)
      }
      if (this.config.submit) {
        window.document.addEventListener('submit', this.submitEvent, true)
      }
      if (this.config.pv) {
        this.collect.on('route-change', (info) => {
          const { config, name } = info
          this.getPageViewEvent(config, name)
        })
      }
      if (this.config.beat) {
        try {
          if (document.readyState === 'complete') {  
            this.beatEvent(this.beatTime)
          } else {
            window.addEventListener('load', () => {
              this.beatEvent(this.beatTime)
            })
          }
          let t1 = 0;
          let t2 = 0;
          let timer = null; // 定时器
          window.addEventListener('scroll', () => {
            clearTimeout(timer);
            timer = setTimeout(isScrollEnd, 500);
            t1 = document.documentElement.scrollTop || document.body.scrollTop;
          })
          const isScrollEnd = () => {
            t2 = document.documentElement.scrollTop || document.body.scrollTop;
            if(t2 == t1){
              this.eventHandel({ eventType: 'dom', eventName: 'beat' }, {
                beat_type: 1
              })
            }
          }
        } catch(e) {}
        try {
          var entryList = window.performance && window.performance.getEntriesByType('paint')
          if (entryList && entryList.length) {
            var observer = new PerformanceObserver((entryList) =>{
              var entries = entryList.getEntries();
              var lastEntry = entries[entries.length - 1];
              var lcp = lastEntry['renderTime'] || lastEntry['loadTime'];
              if (!this.statistics) {
                this.getPageLoadEvent(lcp)
                this.statistics = true
              }
            });
            observer.observe({
              entryTypes: ['largest-contentful-paint']
            });
            // 没触发2S后强制触发
            setTimeout(() => {
              if (this.statistics) return
              this.getPageLoadEvent(entryList[0].startTime || 0)
              this.statistics = true
            }, 2000);
          } else {
            this.getPageLoadEvent(0)
          }
        } catch(e) {
          this.getPageLoadEvent(0)
        }
      }
    }
  }
  removeListener() {
    window.document.removeEventListener('click', this.clickEvent, true)
    window.document.removeEventListener('change', this.changeEvent, true)
    window.document.removeEventListener('submit', this.submitEvent, true)
  }
  clickEvent = (e: Object) => {
    if (isTrack(e['target'], this.options)) {
      this.eventHandel({ eventType: 'dom', eventName: 'click' }, e)
    }
  }
  changeEvent = (e: Object) => {
    this.eventHandel({ eventType: 'dom', eventName: 'change' }, e)
  }
  submitEvent = (e: Object) => {
    this.eventHandel({ eventType: 'dom', eventName: 'submit' }, e)
  }
  beatEvent(beatTime: number) {
    try {
      this.eventHandel({ eventType: 'dom', eventName: 'beat' }, {
        beat_type: 3
      })
      let beaInterval
      if (this.beatTime) {
        beaInterval = setInterval(()=>{
          this.eventHandel({ eventType: 'dom', eventName: 'beat' }, {
            beat_type: 2
          })
        }, beatTime)
      }
      beforePageUnload(() => {
        this.eventHandel({ eventType: 'dom', eventName: 'beat', eventSend: 'becon' }, {
          beat_type: 0
        })
        if(this.beatTime) {
          clearInterval(beaInterval)
        }
      })
    } catch(e) {}
  }
  getPageViewEvent = (eventData: Object, name?: string) => {
    if (name && name === 'pushState') {
      this.eventHandel({ eventType: 'dom', eventName: 'beat'}, {
        beat_type: 0,
        ...eventData
      })
    }
    this.eventHandel({ eventType: 'dom', eventName: 'page_view' }, eventData)
  }
  getPageLoadEvent = (lcp: any) => {
    this.eventHandel({ eventType: 'dom', eventName: 'page_statistics' }, {lcp:lcp})
  }
}