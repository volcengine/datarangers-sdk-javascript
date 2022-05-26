import Cookies from 'js-cookie'

export const COOKIE_KEY = '_TEA_VE_OPEN';
export const COOKIE_KEY_HOST= '_TEA_VE_APIHOST';
export const COOKIE_LANG = 'lang'
export const COOKIE_EDIT_VERISON = '_VISUAL_EDITOR_V'
export const COOKIE_EDIT_URL = '_VISUAL_EDITOR_U'


export function checkSession(): boolean {
  return Cookies.get(COOKIE_KEY) === '1';
}

export function checkSessionHost(): string {
  let HOST = Cookies.get(COOKIE_KEY_HOST)
  try {
    HOST = JSON.parse(HOST)
  } catch (e) {}
  return HOST
}
export function checkEditUrl(): string {
  let url = Cookies.get(COOKIE_EDIT_URL)
  return url
}

export function setSession() {
  try {
    const lang = (window.TEAVisualEditor.lang = window.TEAVisualEditor.lang || Cookies.get(COOKIE_LANG))
    const apiHost = (window.TEAVisualEditor.__editor_ajax_domain = window.TEAVisualEditor.__editor_ajax_domain || Cookies.get(COOKIE_KEY_HOST))
    const verison = (window.TEAVisualEditor.__editor_verison = window.TEAVisualEditor.__editor_verison || Cookies.get(COOKIE_EDIT_VERISON))
    const editUrl = (window.TEAVisualEditor.__editor_url = window.TEAVisualEditor.__editor_url || Cookies.get(COOKIE_EDIT_URL))
    const timestamp = +new Date();
    const furureTimestamp = timestamp + 30 * 60 * 1000; // 30min
    const expires = new Date(furureTimestamp)
    Cookies.set(COOKIE_KEY, '1', {
      expires: expires,
    });
    Cookies.set(COOKIE_KEY_HOST, apiHost, {
      expires: expires,
    });
    Cookies.set(COOKIE_EDIT_URL, editUrl, {
      expires: expires,
    });
    Cookies.set(COOKIE_LANG, lang, {
      expires: expires,
    });
    Cookies.set(COOKIE_EDIT_VERISON, verison || '', {
      expires: expires,
    });
  } catch (e) {
    console.log('set cookie err')
  } 
}

export function removeSession() {
  Cookies.remove(COOKIE_KEY);
}
