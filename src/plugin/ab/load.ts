import { init, addAllowdOrigin, dispatchMsg, receiveMsg, IDataReceive } from '../../util/postMessage'
import { loadScript } from '../../util/tool'
import { VISUAL_AB_CORE, VISUAL_AB_LOADER, SDK_VERSION, VISUAL_URL_INSPECTOR } from '../../collect/constant'

let VISUAL_URL = ''

let isLoaded = false;

function loadEditorScript({ event, editorUrl }) {
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
  window.RANGERSVisualEditor = window.RANGERSVisualEditor || {}
  addAllowdOrigin(['*'])
  var _editorUrl = ''
  init(config, SDK_VERSION)
  receiveMsg('rangers:openVisualABEditor', (event) => {
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
    window.RANGERSVisualEditor.lang = lang
    window.RANGERSVisualEditor.__ab_domin = config.channel_domain || ''
    loadEditorScript({ event, editorUrl: VISUAL_URL })
  })
}
export const loadMuiltlink = (collectInstance: any, config: any) => {
  window.RANGERSVisualEditor.appId = config.app_id
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
    window.RANGERSVisualEditor.__editor_ajax_domain = referrer || '';
    window.RANGERSVisualEditor.__ab_appId = appId || '';
    window.RANGERSVisualEditor.lang = lang || ''
    let inspectorUrl = VISUAL_URL_INSPECTOR
    loadEditorScript({ event, editorUrl: `${inspectorUrl}.js?query=${Date.now()}` })
  })
}
export const loadVisual = (abconfig: any) => {
  window.RANGERSVisualEditor.__ab_config = abconfig
  loadScript(`${VISUAL_AB_LOADER}?query=${Date.now()}`, () => {
    console.log('load visual render success')
  }, () => {
    console.log('load visual render fail')
  })
}
