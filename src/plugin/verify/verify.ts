// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.
import { isArray } from '../../util/tool'
interface IData {
	type: string;
	sign: string;
}
interface IDataPost {
	type: string;
	sign: string;
	pageUrl: string;
	events: any;
}
export default class Verify {
	collector: any
	config: any
	cacheStorgae: any
	eventStorage: any[]
	verifyCookieKey: string
	verifyReady: boolean = false
	waitTime: number = 5000
	cleanStatus: boolean = false
	sign: string
	origin: string
	apply(collector: any, config: any) {
		this.collector = collector;
		this.config = config;
		const { storage } = collector.adapters;
		this.cacheStorgae = new storage(false, 'session');
		this.eventStorage = [];
		this.collector.on('submit-verify', (events: any) => {
			if (events && events.length) {
				this.eventStore(events[0]);
			}
		});
		this.checkCache();
	}
	checkCache() {
		this.verifyCookieKey = `__applog_verify_set_${this.config.app_id}`;
		const reload: string = this.cacheStorgae.getCookie(this.verifyCookieKey);
		const cacheVerify = this.cacheStorgae.getItem(this.verifyCookieKey);
		this.sign = cacheVerify && cacheVerify.sign || '';
		this.origin = cacheVerify && cacheVerify.origin || '*';
		if (false) {
			// 二次访问
			this.verifyReady = true;
		} else {
			// 第一次访问
			const wait = setTimeout(() => {
				this.cleanVerify();
				clearTimeout(wait);
				this.collector.off('submit-verify');
			}, this.waitTime);
			window.addEventListener('message', event => {
				if (event && event.data && event.data.type === 'simulator:verify') {
					clearTimeout(wait);
					this.receMessage(event);
				}
			}, true)
		}
	}
	receMessage(event?: any) {
		if (this.cleanStatus) return;
		let rawData: IData = event.data;
		this.verifyReady = true;
		this.sign = rawData.sign;
		this.origin = event.origin;
		this.cacheStorgae.setItem(this.verifyCookieKey, JSON.stringify({sign: rawData.sign, origin: event.origin}));
		if (this.eventStorage.length) {
			this.postVerify(this.eventStorage, rawData.sign, event.origin);
		}
	}
	eventStore(events: any) {
		if (this.cleanStatus) return;
		if (this.verifyReady) {
			this.postVerify(events, this.sign, this.origin);
		} else {
			this.eventStorage.push(events);
		}
	}
	cleanVerify() {
		this.cleanStatus = true;
		this.eventStorage = [];
	}
	postVerify(events: any, sign: string, origin: string) {
		try {
			const postEvents = [];
			if (isArray(events)) {
				events.forEach(item => {
					postEvents.push(item)
				})
			} else {
				postEvents.push(events)
			}
			const postData: IDataPost = {
				type: 'simulator:verify:event',
				sign,
				pageUrl: window.location.href,
				events: postEvents
			};
			(window.opener || window.parent).postMessage(postData, origin);
		} catch (e) {
			console.log('web verify post message error ~')
		}
	}
}