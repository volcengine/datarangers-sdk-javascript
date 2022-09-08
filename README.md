English | [简体中文](./README.zh-CN.md)

# `DataRangers SDK - javascript`
## Sample

```javascript
npm install 
npm run build
```

## Sample

### 1. Initialize the SDK in your javascript file

```javascript
const SDK = require('@datarangers/sdk-javascript');

SDK.init({
  app_id: 1234, // Replace it with the "APP_ID"
  channel: 'cn', // Replace it with your report channel
  log: true, // Whether to print the log
});

SDK.config({
  username: 'xxx', // when you want report username with event
});

SDK.start(); // Setup complete and now events can be sent.

```

### 2. Report custom user behavior events

```javascript
// Take reporting the "video clicked" behavior of users for example
SDK.event('play_video', {
  title: 'Here is the video title',
});
```

### 3. Report the unique identifier of the currently logged in user

```javascript
// Set "user_unique_id" after a user logs in and the user's unique identifier is retrieved.
 SDK.config({
    user_unique_id: 'zhangsan', // Unique user identifier
  });
```
