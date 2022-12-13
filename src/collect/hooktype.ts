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
  ConfigWebId = 'config-webid',
  ConfigDomain = 'config-domain',
  CustomWebId = 'custom-webid',
  TokenChange = 'token-change',
  TokenReset = 'token-reset',
  ConfigTransform = 'config-transform',
  EnvTransform = 'env-transform',
  SessionReset = 'session-reset',
  SessionResetTime = 'session-reset-time',
  Event = 'event',
  Events = 'events',
  EventNow = 'event-now',
  CleanEvents = 'clean-events',
  BeconEvent = 'becon-event',
  SubmitBefore = 'submit-before',
  SubmitScuess = 'submit-scuess',
  SubmitAfter = 'submit-after',
  SubmitError = 'submit-error',
  SubmitVerify = 'submit-verify',
  SubmitVerifyH = 'submit-verify-h5',

  Stay = 'stay',
  ResetStay = 'reset-stay',
  StayReady = 'stay-ready',
  SetStay = 'set-stay',

  RouteChange = 'route-change',
  RouteReady = 'route-ready',

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

  Profile = 'profile',
  ProfileSet = 'profile-set',
  ProfileSetOnce = 'profile-set-once',
  ProfileUnset = 'profile-unset',
  ProfileIncrement = 'profile-increment',
  ProfileAppend = 'profile-append',
  ProfileClear = 'profile-clear',

  TrackDuration = 'track-duration',
  TrackDurationStart = 'track-duration-start',
  TrackDurationEnd = 'track-duration-end',
  TrackDurationPause = 'track-duration-pause',
  TrackDurationResume = 'tracl-duration-resume',

  Autotrack = 'autotrack',
  AutotrackReady = 'autotrack-ready'
}

export enum DebuggerMesssge {
  DEBUGGER_MESSAGE = 'debugger-message',
  DEBUGGER_MESSAGE_SDK = 'debugger-message-sdk',
  DEBUGGER_MESSAGE_FETCH = 'debugger-message-fetch',
  DEBUGGER_MESSAGE_FETCH_RESULT = 'debugger-message-fetch-result',
  DEBUGGER_MESSAGE_EVENT = 'debugger-message-event',
  DEVTOOL_WEB_READY = 'devtool-web-ready',
}

export default Types;
