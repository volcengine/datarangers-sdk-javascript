// 使用插件
import {Collector} from '@datarangers/sdk-javascript/es/index-base.min.js';
import Ab from '@datarangers/sdk-javascript/es/plugin/ab.js';

const sdk = new Collector('sdk')
sdk.usePlugin(Ab, 'ab')

sdk.init({
  app_id: 1234,
  channel: 'cn',
  log: true,
  enable_ab_test: true
})

sdk.config({
  user_unique_id: 'test_user'
})

sdk.start()


// 曝光实验
sdk.getVar('abkey', 'defaulyValue', (res) => {
  console.log(res)
})

sdk.event('test_event', {
  name: 'ssss'
})