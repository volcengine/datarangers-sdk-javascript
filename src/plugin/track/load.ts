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
    RANGERSVisualEditor: {
      __editor_url?: string;
      __editor_ajax_domain?: string;
      appId?: number|string;
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

window.RANGERSVisualEditor = window.RANGERSVisualEditor || {}

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
    if (event)dispatchMsg(event, 'editorScriptloadError')
    isLoaded = false;
  });
}

export default function readyToLoadEditor(autoTrackInstance, options) {
  let EDITOR_URL =  '' 
  const EDITOR_URL_NEW = `${VISUAL_EDITOR_RANGERS}?query=${Date.now()}`
  window.RANGERSVisualEditor.appId = options.app_id
  addAllowdOrigin(['*'])
  init(options, SDK_VERSION)  
  if (checkSession()) {
    const API_HOST = checkSessionHost()
    let cacheUrl = ''
    if (API_HOST) {
      window.RANGERSVisualEditor.__editor_ajax_domain = API_HOST
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
          window.RANGERSVisualEditor.__editor_ajax_domain = referrer
        }
        EDITOR_URL = EDITOR_URL_NEW
        window.RANGERSVisualEditor.__editor_url = EDITOR_URL
        window.RANGERSVisualEditor.lang = lang
        loadEditorScript({ event, editorUrl: EDITOR_URL, autoTrackInstance })
        setSession()
      })
      window.RANGERSVisualEditor.openAutotrackEditor = () => {
        loadEditorScript({ event: null, editorUrl: window.RANGERSVisualEditor.__editor_url, autoTrackInstance })
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
  } catch(e) {
    console.log('openHeatMapCore error')
  }
}
