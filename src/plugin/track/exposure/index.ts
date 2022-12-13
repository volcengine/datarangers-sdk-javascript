// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import Observer from "./observer";
import Intersection from "./intersection";

class Exposure {
  _observer: any
  _intersection: any
  constructor(config: any, eventHandle: any) {
    if (!config.autotrack || !config.autotrack.exposure) return;
    this._intersection = new Intersection(config, eventHandle);
    this._observer = new Observer(this._intersection);
    if (this._intersection && this._observer) {
      this.initObserver()
    } else {
      console.log('your browser version cannot support exposure, please update~')
    }
  }
  initObserver() {
    const self = this;
    Array.prototype.forEach.call(document.querySelectorAll('[data-exposure]'), (dom) => {
      self._intersection.exposureAdd(dom, 'intersect');
    });
  }
}
export default Exposure
