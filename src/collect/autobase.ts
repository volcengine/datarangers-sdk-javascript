// 极简代码
import { LOG_URL } from './constant'
import Storage from '../util/storage'
import request from '../util/request'

const AutoBase = (opts: any) => {
  const { app_id, channel, onTokenReady } = opts
  const fetchUrl = `${LOG_URL[channel]}/webid`
  const storage = new Storage(false)
  const key = `__tea_cache_tokens_${app_id}`
  var cacheToken = storage.getItem(key)
  if (cacheToken && cacheToken.web_id) {
    onTokenReady(cacheToken.web_id)
  } else {
    request(fetchUrl,
      {
        app_key: '',
        app_id: app_id,
        url: location.href,
        user_agent: window.navigator.userAgent,
        referer: document.referrer,
      },
      3000,
      false,
      (data) =>{
        if (data && data.e === 0) {
          onTokenReady(data.web_id)
          var token = {
            web_id: data.web_id,
            user_unique_id: data.web_id,
            timestamp: Date.now()
          }
          storage.setItem(key, token)
        } else {
          onTokenReady('')
        } 
      },
      () => {
        onTokenReady('')
      },
      true
    )
  }
}

export default AutoBase