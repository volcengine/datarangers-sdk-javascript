
// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

// 曝光监听
import localWebId from '../../../util/local'
import { addListener, removeListener, beforePageUnload } from '../../../util/tool'


enum ExposureTypeE {
  EXPOSURE_ONCE = 0, // 首次曝光
  LIFECYCLE_SHOW_NEW = 3, // 重复曝光
  RESUME_FORM_PAGE = 6, // 其他页面返回
  RESUME_FORM_BACK = 7, // 后台返回
  NOT_EXPOSURE = -1,
}
export default class Intersection {
  static _observer_instance: any = null;
  static _observer_map = new Map();
  count: any;
  instance: any
  observeMap: any
  ratio: number
  eventHandle: any
  timeLimit: number
  exposureType: number
  hashMap: any
  lastState: any
  backStatus: boolean = false
  customType: number | undefined
  collect: any
  constructor(collect: any, config: any, eventHandle: any) {
    this.instance = this.buildObserver();
    this.collect = collect;
    this.observeMap = Intersection._observer_map;
    if (config.autotrack.exposure.ratio) {
      this.ratio = config.autotrack.exposure.ratio
    } else if (config.autotrack.exposure.ratio === 0) {
      this.ratio = 0;
    } else {
      this.ratio = 0.5;
    }
    // 元素出现的时长，有值则等待，无值则立刻曝光
    this.timeLimit = config.autotrack.exposure.stay || 0;
    this.exposureType = ExposureTypeE.NOT_EXPOSURE;
    this.eventHandle = eventHandle;
    this.hashMap = new Map();
    this.backStatus = false
    this.lastState = null
    this.collect.on('re-start-sdk', () => {
      this.visibilitychange()
    })
    this.addListen()
  }
  // dom元素出现在视窗，出现回调；
  buildObserver() {
    if (!Intersection._observer_instance) {
      if (window['IntersectionObserver']) {
        const threshold: number[] = [];
        for (let i = 0; i <= 1.0; i += 0.01) {
          threshold.push(i);
        }
        threshold.push(1)
        try {
          Intersection._observer_instance = new IntersectionObserver(entries => {
            entries.forEach(entry => {
              const elememtMapKey = entry.target['observeId'];
              const exposureDom = this.observeMap.get(elememtMapKey);
              const { target, isIntersecting, intersectionRatio } = entry
              exposureDom.intersectionRatio = intersectionRatio
              if (intersectionRatio <= 0.1) {
                // 离开曝光区
                entry.target['backStatus'] = false;
              }
              this.observeMap.set(elememtMapKey, exposureDom)
              if (intersectionRatio < this.ratio) {
                exposureDom.isIntersecting = false
                exposureDom.added = false
                exposureDom.exposured = false
                exposureDom.startTime = Date.now()
                this.observeMap.set(elememtMapKey, exposureDom)
                return
              }
              if (!exposureDom.added) {
                exposureDom.startTime = Date.now()
                // 元素交互时处理一次，为false或者undefined的代表没有处理过
                exposureDom.added = true
                exposureDom.isIntersecting = true
                if (this.timeLimit) {
                  const exposureTimeout = setTimeout(() => {
                    try {
                      if (exposureDom.isIntersecting && !exposureDom.exposured && this.observeMap.get(elememtMapKey)) {
                        const intersectionRatio = this.observeMap.get(elememtMapKey).intersectionRatio
                        this.exposureEvent(entry, intersectionRatio, elememtMapKey, exposureDom);
                        // this.eventHandle({ eventType: 'dom', eventName: 'exposure' }, entry)
                      }
                    } catch (e) {
                      console.log(`IntersectionObserver setTimeout error，msg: ${JSON.stringify(e)}`);
                    }
                  }, this.timeLimit)
                  exposureDom.wait = exposureTimeout;
                }
                this.observeMap.set(elememtMapKey, exposureDom)
              }
              if (Date.now() - exposureDom.startTime >= this.timeLimit && !exposureDom.exposured) {
                this.exposureEvent(entry, intersectionRatio, elememtMapKey, exposureDom);
              }
            });
          }, {
            threshold,
          });
        } catch (e) {
          console.log(`IntersectionObserver error，msg: ${JSON.stringify(e)}`);
        }

        return Intersection._observer_instance;
      } else {
        console.log('your browser cannot support IntersectionObserver， so cannot report exposure event, please update');
        return null
      }
    } else {
      console.log('your browser cannot support IntersectionObserver， so cannot report exposure event, please update');
      return null
    }
  }

  // 添加进入曝光队列
  exposureAdd(dom: any, type: string) {
    let trueDom = type === 'mutation' ? dom.target : dom;
    const elememtMapKey = trueDom['observeId'];
    const domId = localWebId()
    if (!elememtMapKey && !this.observeMap.has(elememtMapKey)) {
      trueDom['observeId'] = domId;
      trueDom['visible'] = false;
      this.observeMap.set(domId, {
        instance: trueDom.cloneNode(true),
        isIntersecting: false,
      });
      this.observe(trueDom);
    } else {
      const exposureDom = this.observeMap.get(elememtMapKey);
      if (exposureDom && trueDom !== exposureDom.instance) {
        // 有id，但实例变了
        this.unobserve(trueDom)
        this.observeMap.delete(elememtMapKey)
        trueDom['observeId'] = domId;
        trueDom['visible'] = false;
        this.observeMap.set(domId, {
          instance: trueDom.cloneNode(true),
          isIntersecting: false,
        });
        this.observe(trueDom);
      } else {
        if (trueDom['visible'] === true) return;
        this.handleBoundingExposure(trueDom)
      }
    }
  }

  // 从曝光队列中移除
  exposureRemove(dom: Element) {
    if (this.observeMap.has(dom['observeId'])) {
      this.observeMap.delete(dom['observeId'])
      this.unobserve(dom)
      dom['observeId'] = ''
      dom['visible'] = false
    }
  }
  exposureEvent(entry: any, intersectionRatio: number, elememtMapKey: string, exposureDom: any) {
    if (intersectionRatio >= this.ratio) {
      if (entry.target.style.opacity === '0' || entry.target.style.visibility === 'hidden') return;
      // if (entry.target.visible === true || exposureDom.exposured === true) return;
      if (exposureDom.exposured === true) return;
      if (exposureDom.startWait) {
        // 元素有定时器
        clearTimeout(exposureDom.startWait)
      }
      const event = entry.target.getAttribute('data-exposure-event');
      this.eventHandle({ eventType: 'dom', eventName: 'exposure', event, exposureType: this.getExposureType(entry.target) }, entry)
      entry.target.visible = true;
      entry.target.hasExposure = true;
      exposureDom.startTime = Date.now()
      exposureDom.exposured = true
    } else {
      exposureDom.startTime = Date.now()
      exposureDom.exposured = false
      // entry.target.visible = false;
    }
    this.observeMap.set(elememtMapKey, exposureDom)
  }
  observe(dom: Element) {
    this.instance && this.instance.observe(dom);
  }

  unobserve(dom: Element) {
    this.instance && this.instance.unobserve(dom);
  }
  getExposureDomToExposure() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-exposure]'), (dom) => {
      this.handleBoundingExposure(dom)
    });
  }
  visibilitychange() {
    let visTime: any = null;
    if (document.visibilityState === 'visible') {
      // 重置时间
      if (this.timeLimit) {
        visTime = setTimeout(() => {
          this.getExposureDomToExposure()
        }, this.timeLimit)
      } else {
        this.getExposureDomToExposure()
      }
    } else {
      clearTimeout(visTime)
      // 页面隐藏了，可能是最小化，新开webview，等等
      this.customType = undefined;
    }
  }
  handleBoundingExposure(dom: HTMLElement) {
    // 处理非IntersectionObserver触发条件下的曝光
    if (this.getBoundingRatio(dom) >= this.ratio) {
      dom['visible'] = true;
      const event = dom.getAttribute && dom.getAttribute('data-exposure-event');
      this.eventHandle({ eventType: 'dom', eventName: 'exposure', event, exposureType: this.customType || ExposureTypeE.RESUME_FORM_BACK }, dom)
    }
  }
  getBoundingRatio(dom: HTMLElement) {
    const { top, left, width, height } = dom.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const elementArea = width * height;
    if (top >= 0 && left >= 0 && top <= viewportHeight && left <= viewportWidth) {
      // 首先判断元素是否能看见
      const viewWidth = width > viewportWidth ? viewportWidth : width;
      const viewHeight = viewportHeight - top;
      const viewArea = viewWidth * viewHeight;
      return viewArea / elementArea;
    }
    return 0;
  }
  getExposureType(target: any) {
    if (target.visible) {
      // 多页面的重复曝光
      if ((target.backStatus !== false) && (this.backStatus || this.customType || window.performance.navigation.type === 2)) {
        this.exposureType = ExposureTypeE.RESUME_FORM_PAGE
      } else {
        this.exposureType = ExposureTypeE.LIFECYCLE_SHOW_NEW
      }
    } else {
      if (target.hasExposure) {
        // 单页面的重复
        if ((target.backStatus !== false) && (this.backStatus || this.customType || window.performance.navigation.type === 2)) {
          this.exposureType = ExposureTypeE.RESUME_FORM_PAGE
        } else {
          this.exposureType = ExposureTypeE.EXPOSURE_ONCE
        }
      } else {
        if ((target.backStatus !== false) && (this.backStatus || this.customType || window.performance.navigation.type === 2)) {
          this.exposureType = ExposureTypeE.RESUME_FORM_PAGE
        } else {
          this.exposureType = ExposureTypeE.EXPOSURE_ONCE
        }
      }

      // this.exposureType = ExposureTypeE.EXPOSURE_ONCE
    }
    return this.exposureType
  }
  addListen() {
  }
}