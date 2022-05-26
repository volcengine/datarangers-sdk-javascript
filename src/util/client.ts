import UTM from './utm'
import { parseURL, parseUrlQuery } from './tool'
class Client {
  appid: number
  domain: string
  userAgent: string
  appVersion: string
  utm: any
  cookie_expire: number
  constructor(app_id: number, domain: string, cookie_expire: number) {
    this.appid = app_id
    this.domain = domain
    this.userAgent = window.navigator.userAgent
    this.appVersion = window.navigator.appVersion
    this.cookie_expire = cookie_expire
  }
  init() {
    const userAgent = window.navigator.userAgent
    const language = window.navigator.language
    const referrer = document.referrer
    const referrer_host = referrer ? parseURL(referrer).hostname : ''
    const urlQueryObj = parseUrlQuery(window.location.href)
    const platform = /Mobile|htc|mini|Android|iP(ad|od|hone)/.test(this.appVersion) ? 'wap' : 'web'

    this.utm = UTM(this.appid, urlQueryObj, this.domain, this.cookie_expire)
    const _browser = this.browser()
    const _os = this.os()
    return {
      browser: _browser.browser,
      browser_version: _browser.browser_version,
      platform, // 平台类型
      os_name: _os.os_name, // 软件操作系统名称
      os_version: _os.os_version,
      userAgent,
      screen_width: window.screen && window.screen.width,
      screen_height: window.screen && window.screen.height,
      device_model: this.getDeviceModel(_os.os_name), // 硬件设备型号
      language,
      referrer,
      referrer_host,
      utm: this.utm,
      latest_data: this.last(referrer, referrer_host)
    }
  }
  last(referrer: string, referrer_host: string) {
    let $latest_referrer = ''
    let $latest_referrer_host = ''
    let $latest_search_keyword = ''
    const hostname = location.hostname
    let isLast = false
    if (referrer && referrer_host && hostname !== referrer_host) {
      $latest_referrer = referrer
      $latest_referrer_host = referrer_host
      isLast = true
      const referQuery = parseUrlQuery(referrer)
      if (referQuery['keyword']) {
        $latest_search_keyword = referQuery['keyword']
      }
    }
    return {$latest_referrer, $latest_referrer_host, $latest_search_keyword, isLast}  
  }
  browser() {
    let browser = ''
    let browser_version = `${parseFloat(this.appVersion)}`
    let versionOffset
    let semiIndex
    const userAgent = this.userAgent
    if (userAgent.indexOf('Edge') !== -1 || userAgent.indexOf('Edg') !== -1) {
      browser = 'Microsoft Edge'
      if (userAgent.indexOf('Edge') !== -1) {
        versionOffset = userAgent.indexOf('Edge') 
        browser_version = userAgent.substring(versionOffset + 5)
      } else {
        versionOffset = userAgent.indexOf('Edg') 
        browser_version = userAgent.substring(versionOffset + 4)
      }
    } else if ((versionOffset = userAgent.indexOf('MSIE')) !== -1) {
      browser = 'Microsoft Internet Explorer'
      browser_version = userAgent.substring(versionOffset + 5)
    } else if ((versionOffset = userAgent.indexOf('Lark')) !== -1) {
      browser = 'Lark'
      browser_version = userAgent.substring(versionOffset + 5, versionOffset + 11)
    } else if ((versionOffset = userAgent.indexOf('MetaSr')) !== -1) {
      browser = 'sougoubrowser'
      browser_version = userAgent.substring(versionOffset + 7, versionOffset + 10)
    } else if (userAgent.indexOf('MQQBrowser') !== -1 || userAgent.indexOf('QQBrowser') !== -1) {
      browser = 'qqbrowser'
      if (userAgent.indexOf('MQQBrowser') !== -1) {
        versionOffset = userAgent.indexOf('MQQBrowser')
        browser_version = userAgent.substring(versionOffset + 11, versionOffset + 15)
      } else if (userAgent.indexOf('QQBrowser') !== -1) {
        versionOffset = userAgent.indexOf('QQBrowser')
        browser_version = userAgent.substring(versionOffset + 10, versionOffset + 17)
      }
    } else if (userAgent.indexOf('Chrome') !== -1) {
      if ((versionOffset = userAgent.indexOf('MicroMessenger')) !== -1) {
        browser = 'weixin'
        browser_version = userAgent.substring(versionOffset + 15, versionOffset + 20)
      } else if ((versionOffset = userAgent.indexOf('360')) !== -1) {
        browser = '360browser'
        browser_version = userAgent.substring(userAgent.indexOf('Chrome') + 7);
      } else if (userAgent.indexOf('baidubrowser') !== -1 || userAgent.indexOf('BIDUBrowser') !== -1) {
        if (userAgent.indexOf('baidubrowser') !== -1) {
          versionOffset = userAgent.indexOf('baidubrowser')
          browser_version = userAgent.substring(versionOffset + 13, versionOffset + 16)
        } else if (userAgent.indexOf('BIDUBrowser') !== -1) {
          versionOffset = userAgent.indexOf('BIDUBrowser')
          browser_version = userAgent.substring(versionOffset + 12, versionOffset + 15)
        }
        browser = 'baidubrowser'
      } else if ((versionOffset = userAgent.indexOf('xiaomi')) !== -1) {
        if (userAgent.indexOf('openlanguagexiaomi') !== -1) {
          browser = 'openlanguage xiaomi'
          browser_version = userAgent.substring(versionOffset + 7, versionOffset + 13)
        } else {
          browser = 'xiaomi'
          browser_version = userAgent.substring(versionOffset - 7, versionOffset - 1)
        }
      } else if ((versionOffset = userAgent.indexOf('TTWebView')) !== -1) {
        browser = 'TTWebView'
        browser_version = userAgent.substring(versionOffset + 10, versionOffset + 23)
      } else if ((versionOffset = userAgent.indexOf('Chrome')) !== -1){
        browser = 'Chrome'
        browser_version = userAgent.substring(versionOffset + 7)
      } else if ((versionOffset = userAgent.indexOf('Chrome')) !== -1){
        browser = 'Chrome'
        browser_version = userAgent.substring(versionOffset + 7)
      }
    } else if (userAgent.indexOf('Safari') !== -1) {
      if ((versionOffset = userAgent.indexOf('QQ')) !== -1) {
        browser = 'qqbrowser'
        browser_version = userAgent.substring(versionOffset + 10, versionOffset + 16)
      } else if((versionOffset = userAgent.indexOf('Safari')) !== -1){
        browser = 'Safari'
        browser_version = userAgent.substring(versionOffset + 7)
        if ((versionOffset = userAgent.indexOf('Version')) !== -1) {
          browser_version = userAgent.substring(versionOffset + 8)
        }
      }
    } else if ((versionOffset = userAgent.indexOf('Firefox')) !== -1) {
      browser = 'Firefox'
      browser_version = userAgent.substring(versionOffset + 8)
    } else if ((versionOffset = userAgent.indexOf('MicroMessenger')) !== -1) {
      browser = 'weixin'
      browser_version = userAgent.substring(versionOffset + 15, versionOffset + 20)
    } else if ((versionOffset = userAgent.indexOf('QQ')) !== -1) {
      browser = 'qqbrowser'
      browser_version = userAgent.substring(versionOffset + 3, versionOffset + 8)
    }
    if ((semiIndex = browser_version.indexOf(';')) !== -1) {
      browser_version = browser_version.substring(0, semiIndex)
    }
    if ((semiIndex = browser_version.indexOf(' ')) !== -1) {
      browser_version = browser_version.substring(0, semiIndex)
    }
    if ((semiIndex = browser_version.indexOf(')')) !== -1) {
      browser_version = browser_version.substring(0, semiIndex)
    }
    return { browser, browser_version }
  }
  os() {
    let os_name = ''
    let os_version: any = ''
    const clientOpts = [
      {
        s: 'Windows 10',
        r: /(Windows 10.0|Windows NT 10.0|Windows NT 10.1)/,
      },
      {
        s: 'Windows 8.1',
        r: /(Windows 8.1|Windows NT 6.3)/,
      },
      {
        s: 'Windows 8',
        r: /(Windows 8|Windows NT 6.2)/,
      },
      {
        s: 'Windows 7',
        r: /(Windows 7|Windows NT 6.1)/,
      },
      {
        s: 'Android',
        r: /Android/,
      },
      {
        s: 'Sun OS',
        r: /SunOS/,
      },
      {
        s: 'Linux',
        r: /(Linux|X11)/,
      },
      {
        s: 'iOS',
        r: /(iPhone|iPad|iPod)/,
      },
      {
        s: 'Mac OS X',
        r: /Mac OS X/,
      },
      {
        s: 'Mac OS',
        r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/,
      },
    ];
    for (let i = 0; i < clientOpts.length; i++) {
      const cs = clientOpts[i]
      if (cs.r.test(this.userAgent)) {
        os_name = cs.s
        if (os_name === 'Mac OS X' && this.isNewIpad()) {
          os_name = 'iOS'
        }
        break
      }
    }
    const getVersion = (reg, ua) => {
      const result = reg.exec(ua)
      if (result && result[1]) {
        return result[1]
      }
      return ''
    }
    const getMacVersion = (rawRegex, ua) => {
      const regexInstance = RegExp(`(?:^|[^A-Z0-9-_]|[^A-Z0-9-]_|sprd-)(?:${rawRegex})`, "i");
      const match = regexInstance.exec(ua)
      if (match) {
        const result = match.slice(1)
        return result[0]
      }
      return ''
    }
    if (/Windows/.test(os_name)) {
      os_version = getVersion(/Windows (.*)/, os_name)
      os_name = 'windows'
    }
    
    const getAndroidVersion = (ua) => {
      let version = getVersion(/Android ([\.\_\d]+)/, ua)
      if (!version) {
        version = getVersion(/Android\/([\.\_\d]+)/, ua)
      }
      return version
    }
    switch (os_name) {
      case 'Mac OS X':
        os_version = getMacVersion('Mac[ +]OS[ +]X(?:[ /](?:Version )?(\\d+(?:[_\\.]\\d+)+))?', this.userAgent)
        os_name = 'mac'
        break
      case 'Android':
        os_version = getAndroidVersion(this.userAgent)
        os_name = 'android'
        break;
      case 'iOS':
        if (this.isNewIpad()) {
          os_version = getMacVersion('Mac[ +]OS[ +]X(?:[ /](?:Version )?(\\d+(?:[_\\.]\\d+)+))?', this.userAgent)
        } else {
          os_version = /OS (\d+)_(\d+)_?(\d+)?/.exec(this.appVersion)
          if (!os_version) {
            os_version = ''
          } else {
            os_version = `${os_version[1]}.${os_version[2]}.${os_version[3] | 0}`
          }
        }
        os_name = 'ios'
        break
    }
    return { os_name, os_version }
  }
  getDeviceModel(osName: string) {
    let model = ''
    try {
      if (osName === 'android') {
        const tempArray = navigator.userAgent.split(';')
        tempArray.forEach(function(item){
          if (item.indexOf('Build/') > -1) {
            model = item.slice(0, item.indexOf('Build/'))
          }
        })
      } else if (osName === 'ios' || osName === 'mac' || osName === 'windows') {
        if (this.isNewIpad()) {
           model = 'iPad'
        } else {
          const temp = navigator.userAgent.replace('Mozilla/5.0 (', '')
          const firstSeperatorIndex = temp.indexOf(';')
          model = temp.slice(0, firstSeperatorIndex)
        }
      }
    } catch (e) {
      return model.trim()
    }
    return model.trim()
  }
  isNewIpad() {
    return this.userAgent !== undefined && navigator.platform === 'MacIntel'
          && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1
  }
}
export default Client