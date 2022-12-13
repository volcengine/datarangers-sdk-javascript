
// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

interface TrackEnd {
  eventName: string
  params: any
}
export default class TrackDuration {
  collector: any
  config: any
  TrackMap: any
  Types: any
  apply(collector: any, config: any) {
    this.collector = collector;
    this.config = config;
    const { Types } = collector;
    collector.on(Types.TrackDurationStart, (eventName: string) => {
      this.trackStart(eventName)
    });
    collector.on(Types.TrackDurationEnd, (info: TrackEnd) => {
      this.trackEnd(info)
    });
    collector.on(Types.TrackDurationPause, (eventName: string) => {
      this.trackPause(eventName)
    });
    collector.on(Types.TrackDurationResume, (eventName: string) => {
      this.trackResume(eventName)
    });
    this.Types = Types;
    this.TrackMap = new Map();
    this.ready(Types.TrackDuration);
  }
  ready(name: string) {
    this.collector.set(name);
    if (this.collector.hook._hooksCache.hasOwnProperty(name)) {
      const emits = this.collector.hook._hooksCache[name];
      if (!Object.keys(emits).length) return;
      for (let key in emits) {
        if (emits[key].length) {
          emits[key].forEach(item => {
            this.collector.hook.emit(key, item);
          })
        }
      }
    }
  }
  trackStart(eventName: any) {
    this.TrackMap.set(eventName, {
      startTime: Date.now(),
      isPause: false,
      pauseTime: 0,
      resumeTime: 0
    });
  }
  trackEnd(info: TrackEnd) {
    const { eventName, params } = info;
    if (!this.TrackMap.has(eventName)) return;
    const trackData = this.TrackMap.get(eventName);
    let event_duration: number = 0;
    if (trackData.isPause) {
      // 暂停后，未恢复，直接结束
      event_duration = trackData.pauseTime - trackData.startTime;
    } else {
      // 处于未暂停状态，可能是恢复了，可能是从未暂停过
      if (trackData.resumeTime) {
        // 暂停后，恢复了
        event_duration = (trackData.pauseTime - trackData.startTime) + (Date.now() - trackData.resumeTime);
      } else {
        // 未暂停过
        event_duration = Date.now() - trackData.startTime;
      }
    }
    const eventParmas: any = Object.assign(params, {
      event_duration
    })
    this.collector.event(eventName, eventParmas);
    this.cleanTrack(eventName);
  }
  // 事件暂停计时
  trackPause(eventName: string) {
    if (!this.TrackMap.has(eventName)) return;
    const trackData = this.TrackMap.get(eventName);
    if (trackData.isPause) return;
    trackData.isPause = true;
    trackData.pauseTime = Date.now();
    this.TrackMap.set(eventName, trackData);
  }
  // 事件恢复计时
  trackResume(eventName: string) {
    if (!this.TrackMap.has(eventName)) return;
    const trackData = this.TrackMap.get(eventName);
    if (!trackData.isPause) return;
    trackData.isPause = false;
    trackData.resumeTime = Date.now();
    this.TrackMap.set(eventName, trackData);
  }
  cleanTrack(eventName: string) {
    this.TrackMap.delete(eventName);
  }
}