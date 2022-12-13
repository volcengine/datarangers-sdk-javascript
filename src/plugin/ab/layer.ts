// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

type styleIE8 = {
  styleSheet?: {
    cssText: string
  };
};
const STYLE_ID = '__rangers_ab_style__'
function openOverlayer() {
  if (document.getElementById(STYLE_ID)) {
    return
  }
  const css = 'body { opacity: 0 !important; }'
  const head = document.head || document.getElementsByTagName('head')[0]
  const style: HTMLStyleElement & styleIE8 = document.createElement('style')
  style.id = STYLE_ID
  style.type = 'text/css'
  if (style.styleSheet) {
    style.styleSheet.cssText = css
  } else {
    style.appendChild(document.createTextNode(css))
  }
  head.appendChild(style)
}

function closeOverlayer() {
  const style = document.getElementById(STYLE_ID)
  if (style) {
    style.parentElement.removeChild(style)
  }
}

export {
  openOverlayer,
  closeOverlayer,
}
