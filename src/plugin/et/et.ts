export default class Et {
  collect: any
  url: string
  apply(collect: any, config: any) {
    if (!config.event_verify_url) return
    if (typeof config.event_verify_url !== 'string') {
      console.log('please use correct et_test url')
      return
    } else {
      this.url = `${config.event_verify_url}/v1/list_test`
    }
    if (!this.url) return;
    const { Types } = collect
    collect.on(Types.SubmitBefore, (data) => {
      window.navigator.sendBeacon(this.url, JSON.stringify(data))
    });
  }
}