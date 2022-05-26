let  SDK_USE_TYPE = 'npm'
/**@@SCRIPT
SDK_USE_TYPE = 'script'
@@SCRIPT*/
export default class Monitor {
  sdkReady: boolean
  config: any
  collect: any
  url: string
  fetch: any
  apply(collect: any, config: any) {
    this.collect = collect
    this.config = config
    if (this.config.channel_domain) return;
    if (this.config.disable_track_event || this.config.disable_sdk_monitor) return;
    const { fetch } = collect.adapters
    this.fetch = fetch
    this.url = collect.configManager.getUrl('event')
    const { Types } = this.collect
    this.collect.on(Types.Ready, () => {
      this.sdkOnload()
    })
    this.collect.on(Types.SubmitError, ({eventData, errorCode}) => {
      this.sdkError(eventData, errorCode)
    })
  }
  sdkOnload(){
    try {
      const { header, user } = this.collect.configManager.get()
      const { app_id, app_name, sdk_version } = header
      const { web_id } = user
      const event = {
        event: 'onload',
        params: JSON.stringify({
          app_id,
          app_name: app_name || '',
          sdk_version,
          sdk_type: SDK_USE_TYPE,
          sdk_config: this.config,
          sdk_desc: 'TOB'
        }),
        local_time_ms: Date.now(),
      }
      const loadData = {
        events: [event],
        user: {
          user_unique_id: web_id
        },
        header: {},
      }
      setTimeout(() => {
        this.fetch(this.url, [loadData], 30000, false, ()=>{},()=>{}, '566f58151b0ed37e')
      }, 16)
    } catch (e) {
    }
  }
  sdkError(data, code) {
    try {
      const { user, header } = data[0]
      const flatEvents = []
      data.forEach((item) => {
        item.events.forEach((event) => {
          flatEvents.push(event)
        })
      })
      const errEvents = flatEvents.map(event => ({
        event: 'on_error',
        params: JSON.stringify({
          error_code: code,
          app_id: header.app_id,
          app_name: header.app_name || '',
          error_event: event.event,
          sdk_version: header.sdk_version,
          local_time_ms: event.local_time_ms,
          tea_event_index: Date.now(),
          params: event.params,
          header: JSON.stringify(header),
          user: JSON.stringify(user),
        }),
        local_time_ms: Date.now(),
      }))
      const errData = {
        events: errEvents,
        user: {
          user_unique_id: user.user_unique_id,
        },
        header: {
        },
      }
      setTimeout(() => {
        this.fetch(this.url, [errData], 30000, false, ()=>{},()=>{}, '566f58151b0ed37e')
      }, 16)
    } catch (e) {
    }
  }
}
