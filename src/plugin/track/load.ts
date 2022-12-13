// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import { init, addAllowdOrigin, dispatchMsg, receiveMsg, IDataReceive } from '../../util/postMessage'
import { checkSession, checkSessionHost, setSession, checkEditUrl } from './session'
import { VISUAL_EDITOR_RANGERS, HOT_PIC_URL, SDK_VERSION } from '../../collect/constant'
import { loadScript } from '../../util/tool'

interface IAppData {
  aid: number;
  tid: number;
}
interface IXPath {
  xpath: string;
  positions: string[];
}
// eslint-disable-next-line
declare global {
  interface Window {
    TEAVisualEditor: {
      __editor_url?: string;
      __editor_ajax_domain?: string;
      appId?: number | string;
      appData?: IAppData;
      lang?: string;
      __editor_verison?: string;
      __ab_domin?: string;
      __ab_config?: any
      __ab_appId?: number | string;
      getOriginXpath?: (IXPath) => IXPath;
      openAutotrackEditor?: () => void;
    };
  }
}

// window.TEAVisualEditor = window.TEAVisualEditor || {}

let isLoaded = false;

function loadEditorScript({ event, editorUrl, autoTrackInstance }) {
  if (isLoaded) {
    return
  }
  isLoaded = true
  loadScript(editorUrl, () => {
    dispatchMsg(event, 'editorScriptloadSuccess')
    autoTrackInstance.destroy()

  },
    () => {
      if (event) dispatchMsg(event, 'editorScriptloadError')
      isLoaded = false;
    });
}

export default function readyToLoadEditor(autoTrackInstance, options) {
  window.TEAVisualEditor = window.TEAVisualEditor || {}
  let EDITOR_URL = ''
  const EDITOR_URL_NEW = `${VISUAL_EDITOR_RANGERS}?query=${Date.now()}`
  window.TEAVisualEditor.appId = options.app_id
  var isPrivate = options.channel_domain
  var _editorUrl = ''
  addAllowdOrigin(['*'])
  if (isPrivate) {
    // 添加域名白名单
    var domain
    var scriptSrc = ''
    try {
      var resourceList = window.performance.getEntriesByType('resource')
      if (resourceList && resourceList.length) {
        resourceList.forEach(item => {
          if (item['initiatorType'] === 'script') {
            if (item.name && item.name.indexOf('collect') !== -1) {
              scriptSrc = item.name
            }
          }
        })
        if (!scriptSrc) {
          if (document.currentScript) {
            scriptSrc = document.currentScript['src']
          }
        }
        if (scriptSrc) {
          domain = scriptSrc.split('/')
          if (domain && domain.length) {
            _editorUrl = `https:/`
            for (let i = 2; i < domain.length; i++) {
              if (i === domain.length - 1) break;
              _editorUrl = _editorUrl + `/${domain[i]}`
            }
            if (_editorUrl && _editorUrl.indexOf('/5.0')) {
              const editorAry = _editorUrl.split('/5.0')
              _editorUrl = editorAry[0] || _editorUrl
            }
          }
        }
      }
    } catch (e) { }
  }
  init(options, SDK_VERSION)
  if (checkSession()) {
    const API_HOST = checkSessionHost()
    let cacheUrl = ''
    if (API_HOST) {
      window.TEAVisualEditor.__editor_ajax_domain = API_HOST
      cacheUrl = checkEditUrl()
    }
    loadEditorScript({ event: null, editorUrl: cacheUrl || EDITOR_URL_NEW, autoTrackInstance })
    setSession()
  } else {
    try {
      receiveMsg('tea:openVisualEditor', (event) => {
        let rawData: IDataReceive = event.data
        if (typeof event.data === 'string') {
          try {
            rawData = JSON.parse(event.data);
          } catch (e) {
            rawData = undefined;
          }
        }
        if (!rawData) return
        const { referrer, lang } = rawData
        if (referrer) {
          window.TEAVisualEditor.__editor_ajax_domain = referrer
        }
        EDITOR_URL = EDITOR_URL_NEW
        if (isPrivate) {
          const { version } = rawData
          const _version = version ? `/visual-editor-rangers-v${version}` : '/visual-editor-rangers-v1.0.0'
          if (_editorUrl) {
            EDITOR_URL = `${_editorUrl}${_version}.js`
          } else {
            EDITOR_URL = EDITOR_URL_NEW
          }
          window.TEAVisualEditor.__editor_verison = version
        }
        window.TEAVisualEditor.__editor_url = EDITOR_URL
        window.TEAVisualEditor.lang = lang
        loadEditorScript({ event, editorUrl: EDITOR_URL, autoTrackInstance })
        setSession()
      })
      window.TEAVisualEditor.openAutotrackEditor = () => {
        loadEditorScript({ event: null, editorUrl: window.TEAVisualEditor.__editor_url, autoTrackInstance })
      }
    } catch (e) {
      console.log('receive message error')
    }
  }
  try {
    receiveMsg('tea:openHeatMapCore', (event) => {
      let hotUrl = HOT_PIC_URL
      loadEditorScript({ event, editorUrl: `${hotUrl}.js?query=${Date.now()}`, autoTrackInstance })
    })
  } catch (e) {
    console.log('openHeatMapCore error')
  }
}
