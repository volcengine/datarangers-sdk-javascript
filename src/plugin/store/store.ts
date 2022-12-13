// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

class Store {
  collect: any
  config: any
  storage: any
  eventKey: string
  storageNum: number
  fetch: any
  eventUrl: string
  retryNum: number
  retryInterval: number
  retryWaitTime: number = 3000 // 3秒后重试
  retryStatus: boolean = false
  retryCacheStatus: boolean = false
  errorCache: [any]
  apply(collect: any, config: any) {
    if (!config.enable_storage || config.disable_storage) return;
    this.collect = collect;
    this.config = config;
    if (this.collect.destroyInstance) return;
    const { Types } = collect;
    const { storage, fetch } = collect.adapters;
    this.storage = new storage(false);
    this.fetch = fetch;
    this.eventUrl = this.collect.configManager.getUrl('event');
    this.eventKey = `__tea_cache_events_${config.app_id}`;
    this.storageNum = config.storage_num || 50; // 默认最大存储50条数据
    this.retryNum = config.retry_num || 3; // 默认最多重试3次
    this.retryInterval = 1000; // 默认每隔1000ms重试一次
    collect.on(Types.SubmitError, (errorInfo) => {
      if (errorInfo.type !== 'f_data') return;
      // this.retryRightNow(errorInfo);
      this.storeData(errorInfo);
    })
    collect.on(Types.Ready, () => {
      this.checkStorage();
    })
  }
  retryRightNow(errorInfo: any) {
    if (this.retryStatus) {
      // 再重试过程中又有数据异常，则先暂存
      this.errorCache.push(errorInfo);
      return;
    }
    let currentNum = 0;
    this.retryStatus = true;
    const currentInterval = setInterval(() => {
      if (currentNum === 3) {
        // 达到重试次数后不再重试，存储起来
        this.storeData(this.errorCache);
        this.retryStatus = false;
        clearInterval(currentInterval);
        return;
      }
      const { eventData } = errorInfo;
      this.fetchData(eventData, () => {
        this.retryStatus = false;
        clearInterval(currentInterval);
        if (this.retryCacheStatus) {
          this.errorCache.splice(0, 1);
        }
        if (this.errorCache.length) {
          this.retryCacheStatus = true;
          this.retryRightNow(this.errorCache[0]);
        }
      }, () => {
        currentNum++;
      })
    }, this.retryInterval);
  }
  storeData(errorInfo: any) {
    let data = this.storage.getItem(this.eventKey);
    const { eventData } = errorInfo;
    // 数据错误不进行存储
    if (Object.keys(data).length === this.storageNum) return;
    // 数据满了，就不再添加数据
    data[Date.now()] = eventData;
    this.storage.setItem(this.eventKey, data);
  }
  checkStorage() {
    try {
      if (!window.navigator.onLine) return; // 设备未联网
      let data = this.storage.getItem(this.eventKey);
      if (!data || !Object.keys(data).length) return;
      const loadData = {
        events: [{
          event: 'ontest',
          params: {
            app_id: this.config.app_id
          },
          local_time_ms: Date.now(),
        }],
        user: {
          user_unique_id: this.collect.configManager.get('web_id')
        },
        header: {},
      }
      const success = () => {
        const copyData = JSON.parse(JSON.stringify(data));
        for (let key in data) {
          this.fetchData(data[key], () => {
            delete (copyData[key]);
            this.storage.setItem(this.eventKey, copyData);
          }, () => { }, false)
        }
      }
      this.fetchData([loadData], success, () => { }, true);
    } catch (e) {
      console.warn('error check storage');
    }
  }
  fetchData(data: any, success?: any, fail?: any, test?: boolean) {
    this.fetch(this.eventUrl, data, 30000, false, () => {
      success && success();
    }, () => {
      fail && fail();
      console.log('network error，compensate report failk');
    }, test && !this.config.channel_domain ? '566f58151b0ed37e' : '')
  }
}

export default Store
