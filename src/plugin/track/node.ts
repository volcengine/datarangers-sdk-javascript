import { isNeedElement, isAttrFilter } from './dom'


const elementLevel = (element) => {
  if (element.children.length) {
    const childElement = element.children
    if ([].slice.call(childElement).some(element => element.children.length > 0)) {
      return false
    }
    return true
  }
  return true
};

const isSVG = (element) => {
  if (element.tagName.toLowerCase() === 'svg') {
    return true
  }
  let parent = element.parentElement
  let flag = false
  while (parent) {
    if (parent.tagName.toLowerCase() === 'svg') {
      parent = null
      flag = true
    } else {
      parent = parent.parentElement
    }
  }
  return flag
}

export function isTrack(node: Element, options: any): boolean {

  if (node.nodeType !== 1) {
    return false
  }
  if (!options.svg && isSVG(node)) {
    return false
  }
  if (['HTML', 'BODY'].includes(node.tagName.toUpperCase())) {
    return false
  }

  const element = node as HTMLElement
  if (element.style.display === 'none') {
    return false
  }
  if (isNeedElement(element, 'container')) {
    return true
  }
  if (options.track_attr) {
    if (isAttrFilter(element, options.track_attr)) {
      return true
    }
  }
  
  if (!elementLevel(element)) {
    return false
  }

  return true
}
