// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

export type THookInfo = any;
export type THook = (hookInfo?: THookInfo) => void;
export interface IHooks {
  [key: string]: THook[];
}

class Hook {
  _hooks: IHooks;
  _cache: any
  _hooksCache: any
  constructor() {
    this._hooks = {};
    this._cache = [];
    this._hooksCache = {};
  }

  on(type: string, hook: THook) {
    if (!type || !hook || typeof hook !== 'function') {
      return;
    }
    if (!this._hooks[type]) {
      this._hooks[type] = [];
    }
    this._hooks[type].push(hook);
  }

  once(type: string, hook: THook) {
    if (!type || !hook || typeof hook !== 'function') {
      return;
    }
    const proxyHook: THook = (hookInfo: THookInfo) => {
      hook(hookInfo);
      this.off(type, proxyHook);
    };
    this.on(type, proxyHook);
  }

  off(type: string, hook?: THook) {
    if (!type || !this._hooks[type] || !this._hooks[type].length) {
      return;
    }
    if (hook) {
      const index = this._hooks[type].indexOf(hook);
      if (index !== -1) {
        this._hooks[type].splice(index, 1);
      }
    } else {
      this._hooks[type] = [];
    }
  }

  emit(type: string, info?: THookInfo, wait?: string) {
    if (!wait) {
      this._emit(type, info)
    } else {
      if (!type) {
        return
      }
      if (this._cache.indexOf(wait) !== -1) {
        this._emit(type, info)
      } else {
        if (!this._hooksCache.hasOwnProperty(wait)) {
          this._hooksCache[wait] = {}
        }
        if (!this._hooksCache[wait].hasOwnProperty(type)) {
          this._hooksCache[wait][type] = []
        }
        this._hooksCache[wait][type].push(info)
      }
    }
    
  }
  _emit(type: string, info?: THookInfo) {
    if (!type || !this._hooks[type] || !this._hooks[type].length) {
      return;
    }
    [...this._hooks[type]].forEach((hook) => {
      try {
        hook(info);
      } catch (e) {
        //TODO
      }
    });
  }
  set(type: string) {
    if(!type || this._cache.indexOf(type) !== -1) {
      return
    }
    this._cache.push(type)
  }
}

export default Hook;