export interface IInitParam {
  app_id: number;
  channel?: 'cn' | 'va' | 'sg';
  channel_domain?: string;
  app_key?: string;
  log?: boolean;
  disable_auto_pv?: boolean;
}

export interface IConfigParam {
  _staging_flag?: 0 | 1;
  user_unique_id?: string;
  web_id?: string;
  disable_auto_pv?: boolean;
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
  ConfigDomain = 'config-domain',
  TokenChange = 'token-change',
  TokenReset = 'token-reset',
  SessionReset = 'session-reset',
  SessionResetTime = 'session-reset-time',
  Event = 'event',
  Events = 'events',
}
interface SdkConstructor {
  new(name: string): Sdk;
  instances: Array<Sdk>;
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
}
declare const Sdk: Sdk;
export const Collector: SdkConstructor;
export default Sdk;