// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

export type OptionsType = {
  hashTag?: boolean,
  impr?: boolean,
  custom?: string,
  beat?: number
}
export type EventInfo = {
  eventType: 'custom' | 'dom',
  eventName: string,
  extra?: Object,
  eventSend?: string
}

export type EventConfig = {
  mode: 'proxy-capturing',
  submit: boolean,
  click: boolean,
  change: boolean,
  pv: boolean,
  beat: boolean,
  hashTag: boolean,
  impr: boolean
}

export type ScoutConfig = {
  mode: 'xpath' | 'cssSelector' | 'xpathAndCssSelector',
}

export type ParamsStruct = {
  event: string
  is_html: 1
  page_key: string
  element_path: string
  positions: Array<string>
  texts: Array<string>
  element_width?: number
  element_height?: number
  touch_x?: number
  touch_y?: number
  href?: string
  src?: string
  page_title?: string
}