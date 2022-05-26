import Alive from './alive'
import Close from './close'
import { getLogPluginSpace } from '../../collect/namespace'

export default class Stay {
  collect: any
  config: any
  title: string
  url: string
  url_path: string
  pageAlive: any
  pageClose: any
  apply(collect: any, config: any) {
    this.collect = collect
    this.config = config
    if (!this.config.enable_stay_duration) return
    this.title = document.title || location.pathname
    this.url = location.href
    this.url_path = location.pathname
    this.pageAlive = new Alive(collect, config)
    this.pageClose = new Close(collect, config)
    const { Types } = this.collect
    this.collect.on(Types.ResetStay, ({url_path, title, url}) => {
      this.resetStayDuration(url_path, title, url)
    })
    this.collect.on(Types.RouteChange, (info) => {
      if (info.init) return;
      if (config.disable_route_report) return;
      this.resetStayDuration()
    })
    this.collect.on(Types.SetStay, ({url_path, title, url}) => {
      this.setStayParmas(url_path, title, url)
    })
    this.enable(this.url_path, this.title, this.url)
    this.ready(Types.Stay)
    this.collect.emit(Types.StayReady)
  }
  ready(name: string) {
    this.collect.set(name)
    if (this.collect.hook._hooksCache.hasOwnProperty(name)) {
      const emits = this.collect.hook._hooksCache[name]
      if (!Object.keys(emits).length) return
      for (let key in emits) {
        if (emits[key].length) {
          emits[key].forEach(item => {
            this.collect.hook.emit(key, item);
          })
        }
      }
    }
  }
  enable(url_path: string, title: string, url: string) {
    this.pageAlive.enable(url_path, title, url)
    this.pageClose.enable(url_path, title, url)
  }
  disable() {
    this.pageAlive.disable()
    this.pageClose.disable()
  }
  setStayParmas(url_path: string = '', title: string = '', url: string = '') {
    // 专门用来设置stay的参数
    this.pageAlive.setParams(url_path, title, url)
    this.pageClose.setParams(url_path, title, url)
  }
  reset(url_path: string, title: string, url: string) {
    this.disable()
    this.enable(url_path, title, url)
  }
  resetStayDuration(url_path?: string, title?: string, url?: string) {
    this.reset(url_path, title, url)
  }
}

/**@@SCRIPT
const exportStay = (collect: any, config: any) => {
  const stay = new Stay()
  stay.apply(collect, config)
}
try {
  const pluginObject = getLogPluginSpace()
  if (pluginObject) {
    pluginObject.LogStay = exportStay
  }
} catch (e) {
  console.log(e)
}
@@SCRIPT*/