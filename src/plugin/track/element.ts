import { getText, getContainer, getTextSingle, isAttrFilter, getAttributes } from './dom'
import { getXpath, getPositionData, getEventData } from './path'
import { IGNORE } from './event'
interface ElementData {
  element_path: string
  positions: Array<string>
  texts: Array<string>
  element_width?: number
  element_height?: number
  touch_x?:number
  touch_y?: number
  href?: string
  src?: string
  page_manual_key?: string
  elememt_manual_key?: string
  since_page_start_ms?: number
  page_start_ms?: number
  element_title?: string
  element_id?: string
  element_class_name?: string
  element_type?: number
  element_target_page?: string
  page_path?: string
  page_host?: string
}


export default function getElementData(event: any, element: HTMLElement, options: any, ignore?: IGNORE) {
  const elementData: any = {}

  const positionData = getPositionData(element)
  const eventData = getEventData(event, positionData)
  const { element_width, element_height } = positionData
  const { touch_x, touch_y } = eventData
  const { element_path, positions } = getXpath(element)
  const texts = getText(element)
  const page_start_ms = window.performance.timing.navigationStart
  const since_page_start_ms = Date.now() - page_start_ms
  const _position = positions.map(item => `${item}`)
  let elementObj = null
  if (window.TEAVisualEditor.getOriginXpath) {
    elementObj = window.TEAVisualEditor.getOriginXpath({
      xpath: element_path,
      positions: _position
    })
  }
  elementData.element_path = elementObj && elementObj.xpath || element_path
  elementData.positions = elementObj && elementObj.positions || _position
  if (ignore && !ignore.text) {
    elementData.texts = texts
    elementData.element_title = getTextSingle(element)
  }
  elementData.element_id = element.getAttribute('id') || ''
  elementData.element_class_name = element.getAttribute('class') || ''
  elementData.element_type = element.nodeType
  elementData.element_width = Math.floor(element_width)
  elementData.element_height = Math.floor(element_height)
  elementData.touch_x = touch_x
  elementData.touch_y = touch_y
  elementData.page_manual_key = ''
  elementData.elememt_manual_key = ''
  elementData.since_page_start_ms = since_page_start_ms
  elementData.page_start_ms = page_start_ms
  elementData.page_path = location.pathname
  elementData.page_host = location.host

  if (options.track_attr) {
    if (isAttrFilter(element, options.track_attr)) {
      const attrData = getAttributes(element, options.track_attr)
      for (let attr in attrData) {
        elementData[attr] = attrData[attr]
      }
    }
  }
  const containerNoode = getContainer(element)
  if (containerNoode.tagName === 'A') {
    elementData.href = containerNoode.getAttribute('href')
  }

  if (element.tagName === 'IMG') {
    elementData.src = element.getAttribute('src')
  }

  return elementData
}