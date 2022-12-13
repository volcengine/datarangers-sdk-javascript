// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

import { EventConfig, ScoutConfig } from './type'



export type _Config = {
  eventConfig: EventConfig,
  scoutConfig: ScoutConfig
}

export const defaultConfig = {
  eventConfig: {
    mode: "proxy-capturing",
    submit: false,
    click: true,
    change: false,
    pv: true,
    beat: true,
    hashTag: false,
    impr: false,
  },
  scoutConfig: {
    mode: "xpath"
  },
}

export default class Config {
  config: _Config

  constructor(config, options) {
    this.config = config
    this.config.eventConfig = Object.assign(this.config.eventConfig, options)
  }
  getConfig() {
    return this.config
  }
  setConfig(config: _Config) {
    return this.config = config
  }
}
