
export default class Logger {
  isLog: boolean
  name: string
  constructor(name: string, isLog?: boolean) {
    this.isLog = isLog || false
    this.name = name || ''
  }
  info (message: string) {
    if (this.isLog) {
      console.log(`[${this.name}]` + ' ' + message)
    }
  }
  warn(message: string){
    if (this.isLog) {
      console.warn(`[${this.name}]` + ' ' + message)
    }
  }
  error(message: string){
    if (this.isLog) {
      console.error(`[${this.name}]` + ' ' + message)
    }
  }
  throw(msg: string){
    this.error(this.name)
    throw new Error(msg)
  }
}