export interface IInitParam {
  app_id: number;
  channel?: 'cn' | 'va' | 'sg';
  channel_domain?: string;
  app_key?:string;
  caller?: string;
  log?: boolean;
  disable_webid?: boolean;
  disable_sdk_monitor?: boolean;
  disable_storage?: boolean;
  autotrack?: any;
  enable_stay_duration?: any;
  disable_route_report?: boolean;
  disable_session?: boolean;
  disable_heartbeat?:boolean;
  disable_auto_pv?: boolean;
  enable_spa?: boolean;
  user_unique_type?: string;
  enable_ab_test?: boolean;
  max_storage_num?: number;
  enable_storage?: boolean;
  enable_cookie?: boolean;
  enable_ab_visual?: boolean;
  cross_subdomain?: boolean;
  cookie_domain?: string;
  enable_multilink?: boolean;
  multilink_timeout_ms?: number;
  reportTime?: number;
  timeout?: number;
  max_report?: number;
  report_url?: string;
  maxDuration?: number;
  ab_channel_domain?:string;
  configPersist?: number;
  extend?: any;
  ab_timeout?: number;
  Native?:boolean;
  disable_tracer?: boolean;
  extendConfig?: any;
  filter?: any;
  cep?: boolean;
  cep_url?: string;
  spa?: boolean;
  cookie_expire?: number;
  enable_custom_webid?: boolean;
  disable_track_event?: boolean;
}

export interface IConfigParam {
  _staging_flag?: 0 | 1;
  user_unique_id?: string;
  disable_auto_pv?: boolean;
  web_id?: string;
  user_type?: number;
  os_name?: string;
  os_version?: string;
  device_model?: string;
  ab_client?: string;
  ab_version?: string;
  ab_sdk_version?: string;
  traffic_type?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  platform?: string;
  browser?: string;
  browser_version?: string;
  region?: string;
  province?: string;
  city?: string;
  language?: string;
  timezone?: number;
  tz_offset?: number;
  screen_height?: number;
  screen_width?: number;
  referrer?: string;
  referrer_host?: string;
  os_api?: number;
  creative_id?: number;
  ad_id?: number;
  campaign_id?: number;
  ip_addr_id?: number;
  user_agent?: string;
  verify_type?: string;
  sdk_version?: string;
  channel?: string;
  app_id?: number;
  app_name?: string;
  app_version?: string;
  app_install_id?: number;
  user_id?: any;
  device_id?: any;
  wechat_openid?: string,
  wechat_unionid?: string,
  evtParams?: EventParams,
  reportErrorCallback?(eventData: any, errorCode: any): void;
  [key: string]: any;
}

type EventParams = Record<string, any>;

export type SdkOption = Omit<IInitParam, 'app_id'>;

export type SdkHookListener = (hookInfo?: any) => void;

export interface Plugin {
  apply(sdk: Sdk, options: SdkOption): void;
}
export interface PluginConstructor {
  new (): Plugin;
  pluginName?: string;
  init?(Sdk: SdkConstructor): void;
}

export declare enum SdkHook {
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
  CustomWebId = 'custom-webid',
  TokenChange = 'token-change',
  RouteChange = 'route-change',
  ConfigTransform = 'config-transform',
  EnvTransform = 'env-transform',
  SessionReset = 'session-reset',
  SessionResetTime = 'session-reset-time',
  Event = 'event',
  Events = 'events',
  CleanEvents = 'clean-events',
  BeconEvent = 'becon-event',
  SubmitBefore = 'submit-before',
  SubmitAfter = 'submit-after',
  SubmitError = 'submit-error',

  Stay = 'stay',
  ResetStay = 'reset-stay',

  Ab = 'ab',
  AbVar = 'ab-var',
  AbAllVars = 'ab-all-vars',
  AbConfig = 'ab-config',
  AbExternalVersion = 'ab-external-version',
  AbVersionChangeOn = 'ab-version-change-on',
  AbVersionChangeOff = 'ab-version-change-off',
  AbOpenLayer = 'ab-open-layer',
  AbCloseLayer = 'ab-close-layer',

  Profile = 'profile',
  ProfileSet = 'profile-set',
  ProfileSetOnce = 'profile-set-once',
  ProfileUnset = 'profile-unset',
  ProfileIncrement = 'profile-increment',
  ProfileAppend = 'profile-append',
  ProfileClear = 'profile-clear',

  Autotrack = 'autotrack'
}
interface SdkConstructor {
  new (name: string): Sdk;
  instances: Array<Sdk>;
  usePlugin: (plugin: PluginConstructor, pluginName?: string) => void;
}
interface Sdk {
  Types: typeof SdkHook;

  on(type: string, hook: SdkHookListener): void;
  once(type: string, hook: SdkHookListener): void;
  off(type: string, hook?: SdkHookListener): void;
  emit(type: string, info?: any, wait?: string): void;

  init(options: IInitParam): void;
  config(configs?: IConfigParam): void;
  getConfig(key?: string): Record<string, any>;
  setDomain(domain: string): void;
  start(): void;
  send(): void;
  set(type: string): void;
  event(event: string, params?: EventParams): void;
  beconEvent(event: string, params?: EventParams): void;
  event(
    events:
      | Array<[string, EventParams] | [string, EventParams, number]>
  ): void;

  predefinePageView(params: any): void;
  clearEventCache(): void;
  setWebIDviaUnionID(unionId: string): void;
  setWebIDviaOpenID(openId): void;
  getToken(callback: (info: Record<string, string | number>) => void, timeout?: number): void;

  resetStayDuration(url_path?: string , title?: string, url?: string): void;
  resetStayParams(url_path?: string , title?: string, url?: string): void;

  profileSet(profile: any): void;
  profileSetOnce(profile: any): void;
  profileIncrement(profile: any): void;
  profileUnset(key: string): void;
  profileAppend(profile: any): void;

  setExternalAbVersion(vids: string): void;
  getVar(name: string, defaultValue: any, callback: (value: any) => void): void;
  getAllVars(callback: (value: any) => void): void;
  getAbSdkVersion(): string;
  onAbSdkVersionChange(callback: (vids: string) => void): () => void;
  offAbSdkVersionChange(callback: (vids: string) => void): void;
  setExternalAbVersion(vids: string | null): void;
  getAbConfig(params: Record<string, any>, callbacl: (value: any) => void): void;
  openOverlayer(): void;
  closeOverlayer(): void;
}
declare const Sdk: Sdk;
export const Collector: SdkConstructor;
export default Sdk;