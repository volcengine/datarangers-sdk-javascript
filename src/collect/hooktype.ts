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
  BeconEvent = 'becon-event',
  SubmitBefore = 'submit-before',

  Ab = 'ab',
  AbVar = 'ab-var',
  AbAllVars = 'ab-all-vars',
  AbConfig = 'ab-config',
  AbExternalVersion = 'ab-external-version',
  AbVersionChangeOn = 'ab-version-change-on',
  AbVersionChangeOff = 'ab-version-change-off',
  AbOpenLayer = 'ab-open-layer',
  AbCloseLayer = 'ab-close-layer',
  AbReady = 'ab-ready',
  AbComplete = 'ab-complete',
  AbTimeout = 'ab-timeout',

}

export default Types;
