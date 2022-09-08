简体中文 | [English](./README.md)
# `DataRangers SDK - Web端`
## 构建SDK
npm install 
npm run build

## 使用方式

### 1. 在你的js文件中初始化SDK

```javascript
const SDK = require('@datarangers/sdk-javascript');

SDK.init({
  app_id: 1234, // 替换成你申请的 "APP_ID"
  channel: 'cn', // 选择你要上报的区域，cn: 国内 sg: 新加坡 va:美东
  log: true, // 是否打印日志
});

SDK.config({
  username: 'xxx', // 你想要上报一个username的公共属性
});

SDK.start(); // 初始化完成，事件开始上报

```

### 2. 上报自定义用户事件

```javascript
// 比如上报一个'play_video'视频播放的事件
SDK.event('play_video', {
  title: 'Here is the video title',
});
```

### 3. 使用当前登录用户的信息做为唯一标识来进行上报

```javascript
// 可以在用户登录后获取带有唯一性的标识来设置给user_unique_id
 SDK.config({
    user_unique_id: 'zhangsan', // 用户唯一标识，可以是你的系统登录用户id
  });
```
