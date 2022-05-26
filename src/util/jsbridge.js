// @ts-nocheck
class AppBridge {
  constructor(native) {
    this.native = native
  }
  bridgeInject(){
    try {
      if (!this.native) return false
      if (AppLogBridge) {
        console.log(`AppLogBridge is injected`)
        return true
      } else {
        console.log(`AppLogBridge is not inject`)
        return false
      }
    } catch(e) {
      console.log(`AppLogBridge is not inject`)
      return false
    }
  }
  bridgeReady(){
    return new Promise((resolve, reject) => {
      try {
        if (this.bridgeInject()) {
          AppLogBridge.hasStarted(start => {
            console.log(`AppLogBridge is started? : ${start}`)
            if (start) {
              resolve(true)
            } else {
              reject(false)
            }
          })
        } else {
          reject(false)
        }
      } catch (e) {
        console.log(`AppLogBridge, error:${JSON.stringify(e.stack)}`)
        reject(false)
      }
    })
  }
  setNativeAppId(appId) {
    try {
      AppLogBridge.setNativeAppId(JSON.stringify(appId))
      console.log(`change bridge appid, event report with appid: ${appId}`)
    } catch (e) {
      console.error(`setNativeAppId error`)
    }
  }
  setConfig(info) {
    try {
      Object.keys(info).forEach((key) => {
        if (key === 'user_unique_id'){
          this.setUserUniqueId(info[key])
        } else {
          if (config[key]) {
            this.addHeaderInfo(key, info[key])
          } else {
            this.removeHeaderInfo(key)
          }
        }
      })
    } catch (e) {
      console.error(`setConfig error`)
    }
  }
  setUserUniqueId(uuid){
    try {
      AppLogBridge.setUserUniqueId(uuid)
    } catch(e) {
      console.error(`setUserUniqueId error`)
    } 
  }
  addHeaderInfo(key, value){
    try {
      AppLogBridge.addHeaderInfo(key, value)
    } catch (e){
      console.error(`addHeaderInfo error`)
    }
  }
  setHeaderInfo(map){
    try {
      AppLogBridge.setHeaderInfo(JSON.stringify(map))
    } catch (e) {
      console.error(`setHeaderInfo error`)
    }
  }
  removeHeaderInfo(key){
    try {
      AppLogBridge.removeHeaderInfo(key)
    } catch (e) {
      console.error(`removeHeaderInfo error`)
    }
  }
  reportPv(params) {
    this.onEventV3('predefine_pageview', params)
  }
  onEventV3(event, params) {
    try {
      AppLogBridge.onEventV3(event, params)
    } catch(e) {
      console.error(`onEventV3 error`)
    }
  }
  profileSet(profile){
    try {
      AppLogBridge.profileSet(profile)
    } catch (error) {
      console.error(`profileSet error`)
    }
  }
  profileSetOnce(profile){
    try {
      AppLogBridge.profileSetOnce(profile)
    } catch (error) {
      console.error(`profileSetOnce error`)
    }
  }
  profileIncrement(profile){
    try {
      AppLogBridge.profileIncrement(profile)
    } catch (error) {
      console.error(`profileIncrement error`)
    }
  }
  profileUnset(key){
    try {
      AppLogBridge.profileUnset(key)
    } catch (error) {
      console.error(`profileUnset error`)
    }
  }
  profileAppend(profile){
    try {
      AppLogBridge.profileAppend(profile)
    } catch (error) {
      console.error(`profileAppend error`)
    }
  }
}

export default AppBridge
