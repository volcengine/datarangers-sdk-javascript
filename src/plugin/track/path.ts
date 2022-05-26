import { isNeedElement } from './dom'

export function getPositionData(target: HTMLElement) {
  if (!target) {
    return
  }
  const rect = target.getBoundingClientRect()
  const { width, height, left, top } = rect
  return {
    left,
    top,
    element_width: width,
    element_height: height,
  }
}

export function getEventData(event: any = {}, extData: any = {}) {
  const { clientX, clientY } = event
  const { left, top } = extData
  const touchX = clientX - left >= 0 ? clientX - left : 0
  const touchY = clientY - top >=0 ? clientY - top : 0
  return {
    touch_x: Math.floor(touchX),
    touch_y: Math.floor(touchY),
  }
}

export function getXpath(target: HTMLElement): {element_path: string, positions: Array<number>} {
  const targetList = []
  while(target.parentElement !== null) {
    targetList.push(target)
    target = target.parentElement
  }

  let xpathArr: Array<string> = []
  const positions: Array<number> = []
  targetList.forEach(cur => {
    const { str,index } = getXpathIndex(cur)
    xpathArr.unshift(str)
    positions.unshift(index)
  })
  return { element_path: `/${xpathArr.join('/')}`, positions}
}

function getXpathIndex (dom:HTMLElement):{str: string, index:number} {
  if (dom === null) {
    return {str: '', index: 0}
  }
  let index = 0
  const parent = dom.parentElement
  if (parent) {
    const childrens = parent.children
    for (let i= 0;i<childrens.length;i++) {
      if (childrens[i] === dom) break
      if (childrens[i].nodeName === dom.nodeName) {
        index++
      }
    }
  }
  const tag = [
    dom.nodeName.toLowerCase(),
    (isNeedElement(dom, 'list') ? '[]' : '')
  ].join('')
  return { str: tag, index: index }
}
