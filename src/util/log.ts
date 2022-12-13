// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

export default class Logger {
  isLog: boolean
  name: string
  constructor(name: string, isLog?: boolean) {
    this.isLog = isLog || false
    this.name = name || ''
  }
  info(message: string) {
    if (this.isLog) {
      console.log('%c %s', 'color: yellow; background-color: black;', `[instance: ${this.name}]` + ' ' + message)
    }
  }
  warn(message: string) {
    if (this.isLog) {
      console.warn('%c %s', 'color: yellow; background-color: black;', `[instance: ${this.name}]` + ' ' + message)
    }
  }
  error(message: string) {
    if (this.isLog) {
      console.error(`[instance: ${this.name}]` + ' ' + message)
    }
  }
  throw(msg: string) {
    this.error(this.name)
    throw new Error(msg)
  }
}
