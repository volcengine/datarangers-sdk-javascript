// 正常使用
import sdk from '@datarangers/sdk-javascript';

sdk.init({
  app_id: 1234,
  channel: 'cn',
  log: true
})

sdk.config({
  user_unique_id: 'test_user'
})

sdk.start()


sdk.event('test_event', {
  name: 'ssss'
})