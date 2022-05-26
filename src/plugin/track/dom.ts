import { isArray } from '../../util/tool'
export function isNeedElement(element:HTMLElement | null, type: string = 'list'): boolean {
  if (!element) return false
  if (type && type === 'list') {
    if (['LI','TR','DL'].includes(element.nodeName)) return true
    if (element.dataset && element.dataset.hasOwnProperty('teaIdx')) return true
    if (element.hasAttribute && element.hasAttribute('data-tea-idx')) return true
  } else {
    if (['A', 'BUTTON'].includes(element.nodeName)) return true
    if (element.dataset && element.dataset.hasOwnProperty('teaContainer')) return true
    if (element.hasAttribute && element.hasAttribute('data-tea-container')) return true
    if (element.hasAttribute && hasAttributes(element, 'ss')) return true
  }
  return false
}
export const isAttrFilter = (element:HTMLElement, attrs: any) => {
  if (hasAttributes(element, attrs)) return true
  return false
}
export function getContainer(element:HTMLElement):HTMLElement {
  let current =  element
  while (current && !isNeedElement(current, 'container')) {
    if (current.nodeName === 'HTML' || current.nodeName === 'BODY') {
      return element
    }
    current = current.parentElement
  }
  return current || element
}

export function getNodeText(node:Node): string {
  let text = ''
  if (node.nodeType === 3) {
    text = node.textContent.trim()
  } else if (node['dataset'] && node['dataset'].hasOwnProperty('teaTitle')) {
    text = node['getAttribute']('data-tea-title')
  } else if (node['hasAttribute']('ata-tea-title')) {
    text = node['getAttribute']('data-tea-title')
  } else if (node['hasAttribute']('title')) {
    text = node['getAttribute']('title')
  } else if (node.nodeName === 'INPUT' && ['button', 'submit'].includes(node['getAttribute']('type'))) {
    text = node['getAttribute']('value')
  } else if (node.nodeName === 'IMG' && node['getAttribute']('alt')){
    text = node['getAttribute']('alt')
  }
  return text.slice(0,200)
}

export function getText(element:HTMLElement):string[] {
  const ele = getContainer(element)
  const textArr = [];
  (function _get(node:Node) {
    const text = getNodeText(node)
    if (text && textArr.indexOf(text)  === -1) {
      textArr.push(text)
    }
    if (node.childNodes.length > 0) {
      const {childNodes} = node
      for (let i = 0;i < childNodes.length; i++) {
        if (childNodes[i].nodeType !== 8) {
          _get(childNodes[i])
        }
      }
    }
  })(ele)
  return textArr
}

export function getTextSingle(element:HTMLElement):string {
  const ele = getContainer(element)
  let text = '';
  (function _get(node:Node) {
    const _text = getNodeText(node)
    if (_text) {
      text = text + _text
    }
    if (node.childNodes.length > 0) {
      const {childNodes} = node
      for (let i = 0;i < childNodes.length; i++) {
        if (childNodes[i].nodeType === 3) {
          _get(childNodes[i])
        }
      }
    }
  })(ele)
  return text
}

export function ignore(element:any): boolean {
  let _element = element
  while (_element && _element.parentNode) {
    if (_element.hasAttribute('data-tea-ignore')) return true
    if (_element.nodeName === 'HTML' || _element.nodeName === 'body') return false
    _element = _element.parentNode
  }
  return false
}

export const hasAttribute = (ele:HTMLElement, attr: string) => {
  if (ele.hasAttribute) {
    return ele.hasAttribute(attr);
  } else if (ele.attributes) {
    return !!(ele.attributes[attr] && ele.attributes[attr].specified);
  }
}

export const hasAttributes = (ele:HTMLElement, attrs: any) => {
  if (typeof attrs === 'string') {
    return hasAttribute(ele, attrs);
  } else if (isArray(attrs)) {
    let result = false;
    for (let i = 0; i < attrs.length; i++) {
      let testResult = hasAttribute(ele, attrs[i]);
      if (testResult) {
        result = true;
        break;
      }
    }
    return result;
  }
}

export const getAttributes = (ele:HTMLElement, attrs: any) => {
  const result = {}
  if (typeof attrs === 'string') {
    if (hasAttribute(ele, attrs)) {
      result['attrs'] = ele.getAttribute(attrs)
    }
  } else {
    if (isArray(attrs)) {
      for (let i = 0; i < attrs.length; i++) {
        let testResult = hasAttribute(ele, attrs[i]);
        if (testResult) {
          result[attrs[i]] = ele.getAttribute(attrs[i])
        }
      }
    }
  }
  return result
}

