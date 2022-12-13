// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import { init, addAllowdOrigin, dispatchMsg, receiveMsg, IDataReceive } from '../../util/postMessage'
import { loadScript } from '../../util/tool'
import { VISUAL_AB_CORE, VISUAL_AB_LOADER, SDK_VERSION, VISUAL_URL_INSPECTOR } from '../../collect/constant'

let VISUAL_URL = ''

let isLoaded = false;

function loadEditorScript({ event, editorUrl, collectInstance, fromSession = true }) {
  if (isLoaded) {
    return
  }
  isLoaded = true
  loadScript(editorUrl, () => {
    dispatchMsg(event, 'abEditorScriptloadSuccess')
  },
    () => {
      if (event) {
        dispatchMsg(event, 'abEditorScriptloadError')
      }
      isLoaded = false;
    });
}

export default function readyToLoadEditor(collectInstance: any, config: any) {
  window.TEAVisualEditor = window.TEAVisualEditor || {}
  addAllowdOrigin(['*'])
  var _editorUrl = ''
  init(config, SDK_VERSION)
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
        // if the filename is error
        if (document.currentScript) {
          // not support in ie
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
          _editorUrl = `${_editorUrl}/visual-ab-core`
        }
      }
    }
  } catch (e) { }
  receiveMsg('tea:openVisualABEditor', (event) => {
    let rawData: IDataReceive = event.data
    if (typeof event.data === 'string') {
      try {
        rawData = JSON.parse(event.data);
      } catch (e) {
        rawData = undefined;
      }
    }
    if (!rawData) return
    const { lang, appId } = rawData

    if (appId !== config.app_id) {
      dispatchMsg(event, 'appIdError')
      console.error('abtest appid is not belong the page appid please check');
      return;
    }
    const { version } = rawData
    if (version) {
      var _version = version ? `.${version}` : '.1.0.1'
      if (_editorUrl) {
        VISUAL_URL = `${_editorUrl}${_version}.js?query=${Date.now()}`
      } else {
        VISUAL_URL = `${VISUAL_AB_CORE}?query=${Date.now()}`
      }
    } else {
      VISUAL_URL = `${VISUAL_AB_CORE}?query=${Date.now()}`
    }
    window.TEAVisualEditor.lang = lang
    window.TEAVisualEditor.__ab_domin = config.channel_domain || ''
    loadEditorScript({ event, editorUrl: VISUAL_URL, collectInstance })
  })
}
export const loadMuiltlink = (collectInstance: any, config: any) => {
  window.TEAVisualEditor = window.TEAVisualEditor || {}
  window.TEAVisualEditor.appId = config.app_id
  receiveMsg('tea:openTesterEventInspector', (event) => {
    let rawData: IDataReceive = event.data
    if (typeof event.data === 'string') {
      try {
        rawData = JSON.parse(event.data);
      } catch (e) {
        rawData = undefined;
      }
    }
    if (!rawData) return
    const { referrer, lang, appId } = rawData;
    window.TEAVisualEditor.__editor_ajax_domain = referrer || '';
    window.TEAVisualEditor.__ab_appId = appId || '';
    window.TEAVisualEditor.lang = lang || ''
    let inspectorUrl = VISUAL_URL_INSPECTOR
    loadEditorScript({ event, editorUrl: `${inspectorUrl}.js?query=${Date.now()}`, collectInstance })
  })
}
export const loadVisual = (abconfig: any) => {
  window.TEAVisualEditor = window.TEAVisualEditor || {}
  window.TEAVisualEditor.__ab_config = abconfig
  loadScript(`${VISUAL_AB_LOADER}?query=${Date.now()}`, () => {
    console.log('load visual render success')
  }, () => {
    console.log('load visual render fail')
  })
}
