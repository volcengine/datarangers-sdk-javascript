// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

enum Types {
  Init = 'init',
  Config = 'config',
  Start = 'start',
  Ready = 'ready',
  TokenComplete = 'token-complete',
  TokenStorage = 'token-storage',
  TokenFetch = 'token-fetch',
  TokenError = 'token-error',
  ConfigUuid = 'config-uuid',
  TokenChange = 'token-change',
  TokenReset = 'token-reset',
  SessionReset = 'session-reset',
  SessionResetTime = 'session-reset-time',
  Event = 'event',
  Events = 'events',
  EventNow = 'event-now',
  CleanEvents = 'clean-events',
  BeconEvent = 'becon-event',

}

export default Types;
