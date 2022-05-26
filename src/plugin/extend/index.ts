import { pluginExtendList } from '../../collect/plugin'
import { getLogPluginSpace } from '../../collect/namespace'

const pluginObject = getLogPluginSpace()
class PluginExtend {
  _plugin: any
  config: any
  channel: string
  collect: any
  apply(collect: any, config: any) {
    this._plugin = {}
    this.config = config
    this.collect = collect
    this.channel = config['channel'] || 'cn'
    this.loadExtend()
  }
  loadExtend() {
    try {
      this.collect.remotePlugin.forEach((pluginObj: any, pluginName: any) => {
        if (pluginObj === 'sdk') {
          // 内部插件
          if (pluginExtendList.hasOwnProperty(pluginName)) {
            // 有这个内部插件
            const _object = pluginExtendList[pluginName]['object']
            const src = `${pluginExtendList[pluginName]['src'][this.channel]}?query=${Date.now()}`
            this.exist(pluginName, _object, src)
          } else {
            console.warn(`your${pluginName} is not exist，please check plugin name`)
          }
        } else if (typeof pluginObj === 'object') {
          if (pluginObj.src) {
            // 远程src
            this.exist(pluginName, pluginObj.call, pluginObj.src)            
          } else {
            // 本地文件
            this.process(pluginName, pluginObj.instance, 'INSTANCE')
          }
        }
      })
    } catch (e) {
      console.log(`load extend error`)
    } 
  }
  exist(pluginName: string, _object: any, src: string) {
    if (pluginObject[_object]) {
      // window下已有插件
      this.process(pluginName, pluginObject[_object])
    } else {
      this.loadPlugin(pluginName, src, ()=> {
        this.process(pluginName, pluginObject[_object])
        console.log(`load ${pluginName} success`)
      }, () => {
        console.log(`load ${pluginName} error`)
      })
    }
  }
  process(pluginName: string, PluginInstance: any, type?: string) {
    try {
      if (type) {
        const instance = new PluginInstance()
        instance.apply && instance.apply(this.collect, this.config)
        console.log(`excude ${pluginName} success`)
      } else {
        PluginInstance && PluginInstance(this.collect, this.config)
      }
    } catch (e) {
      console.log(`excude ${pluginName} error, message:${e.message}`)
    } 
  }
  loadPlugin(type, src, success, error) {
    try {
      const script = document.createElement('script')
      script.src = src
      if (!this._plugin[type]) {
        this._plugin[type] = []
      }
      this._plugin[type].push(success)
      script.onerror = () => {
        error(src)
      }
      script.onload = () => {
        this._plugin[type].forEach(callback => {
          callback()
        })
      }
      document.getElementsByTagName('head')[0].appendChild(script)
    } catch (e) {}
  }
}
export default PluginExtend
