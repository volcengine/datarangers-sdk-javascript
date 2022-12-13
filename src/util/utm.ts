// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import Storage from './storage'
const UTM = (app_id: number, urlQueryObj: any, domain: string, cookie_expire: number) => {
  const storage = new Storage(false)
  const session = new Storage(false, 'session')
  const cacheKey = app_id ? `_tea_utm_cache_${app_id}` : '_tea_utm_cache'
  const sourceKey = app_id ? `_$utm_from_url_${app_id}` : '_$utm_from_url'
  let utmObj = {}
  const tracer_data = ['tr_shareuser', 'tr_admaster', 'tr_param1', 'tr_param2', 'tr_param3', 'tr_param4', '$utm_from_url']
  let _utmObj = {
    ad_id: Number(urlQueryObj.ad_id) || undefined,
    campaign_id: Number(urlQueryObj.campaign_id) || undefined,
    creative_id: Number(urlQueryObj.creative_id) || undefined,
    utm_source: urlQueryObj.utm_source,
    utm_medium: urlQueryObj.utm_medium,
    utm_campaign: urlQueryObj.utm_campaign,
    utm_term: urlQueryObj.utm_term,
    utm_content: urlQueryObj.utm_content,
    tr_shareuser: urlQueryObj.tr_shareuser,
    tr_admaster: urlQueryObj.tr_admaster,
    tr_param1: urlQueryObj.tr_param1,
    tr_param2: urlQueryObj.tr_param2,
    tr_param3: urlQueryObj.tr_param3,
    tr_param4: urlQueryObj.tr_param4,
  }
  try {
    let utmFromUrl = false
    for (let key in _utmObj) {
      if (_utmObj[key]) {
        if (tracer_data.indexOf(key) !== -1) {
          if (!utmObj.hasOwnProperty('tracer_data')) {
            utmObj['tracer_data'] = {}
          }
          utmObj['tracer_data'][key] = _utmObj[key]
        } else {
          utmObj[key] = _utmObj[key]
        }
        utmFromUrl = true
      }
    }
    if (utmFromUrl) {
      // 发现url上有则更新缓存，并上报
      session.setItem(sourceKey, '1')
      storage.setCookie(cacheKey, JSON.stringify(utmObj), cookie_expire, domain)
    } else {
      // url没有则取缓存
      let cache = storage.getCookie(cacheKey, domain)
      if (cache) {
        utmObj = JSON.parse(cache)
      }
    }
    if (session.getItem(sourceKey)) {
      if (!utmObj.hasOwnProperty('tracer_data')) {
        utmObj['tracer_data'] = {}
      }
      utmObj['tracer_data']['$utm_from_url'] = 1
    }
  } catch (e) {
    return _utmObj
  }
  return utmObj
}
export default UTM