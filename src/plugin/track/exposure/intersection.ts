
// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

// 曝光监听
export default class Intersection {
  static _observer_instance = null;
  static _observer_map = new Map();
  count: number = 1;
  instance: any
  observeMap: any
  Ratio: number
  EventHandle: any
  constructor(config: any, eventHandle: any) {
    this.instance = this.buildObserver();
    this.observeMap = Intersection._observer_map;
    if (config.autotrack.exposure.ratio) {
      this.Ratio = config.autotrack.exposure.ratio
    } else if (config.autotrack.exposure.ratio === 0) {
      this.Ratio = 0
    } else {
      this.Ratio = 0.5
    }
    this.EventHandle = eventHandle
  }

  // dom元素出现在视窗，出现回调；
  buildObserver() {
    if (!Intersection._observer_instance) {
      if (IntersectionObserver) {
        Intersection._observer_instance = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            const exposureDom = this.observeMap.get(entry.target['_observeId']);
            if (exposureDom) {
              this.exposureEvent(entry);
            }
          });
        }, {
          threshold: [0.01, 0.25, 0.5, 0.75, 1],
        });
      }
      return Intersection._observer_instance;
    } else {
      console.log('your browser cannot support IntersectionObserver');
      return null
    }
  }

  // 添加进入曝光队列
  exposureAdd(dom: any, type: string) {
    let _dom = dom;
    if (type === 'mutation') {
      _dom = dom.target;
    }
    const count = _dom['_observeId'];
    if (!count && !this.observeMap.has(count)) {
      _dom['_observeId'] = this.count;
      _dom['visible'] = false;
      this.observeMap.set(this.count, _dom);
      this.observe(_dom);
      this.count++;
    } else {
      if (_dom['visible'] === false) {
        const { top, left, right, bottom } = _dom.getBoundingClientRect();
        if (top >= 0 && bottom <= window.innerHeight && left >= 0 && right <= window.innerWidth) {
          _dom['visible'] = true;
          this.EventHandle({ eventType: 'dom', eventName: 'exposure' }, dom)
        }
      }
    }
  }

  // 从曝光队列中移除
  exposureRemove(dom: Element) {
    if (this.observeMap.has(dom['_observeId'])) {
      this.observeMap.delete(dom['_observeId'])
      this.unobserve(dom)
    }
  }
  exposureEvent(entry) {
    if (entry.intersectionRatio >= this.Ratio && entry.isIntersecting) {
      if (entry.target.style.opacity === '0' || entry.target.style.visibility === 'hidden') return;
      if (entry.target.visible === true) return;
      entry.target.visible = true;
      this.EventHandle({ eventType: 'dom', eventName: 'exposure' }, entry)
    } else {
      entry.target.visible = false;
    }
  }
  observe(dom: Element) {
    this.instance && this.instance.observe(dom);
  }

  unobserve(dom: Element) {
    this.instance && this.instance.unobserve(dom);
  }

}