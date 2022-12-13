// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.

// H5埋点实时验证
import { isArray, parseUrlQuery, beforePageUnload } from '../../util/tool'
import fetch from '../../util/fetch'
export default class VerifyH {
	collector: any
	config: any
	eventStorage: any[]
	domain: string
	verifyReady: boolean = false
	cleanStatus: boolean = false
	key: string
	heart: any
	apply(collector: any, config: any) {
		this.collector = collector;
		this.config = config;
		this.eventStorage = [];
		this.collector.on('submit-verify-h5', (events: any) => {
			if (events && events.length) {
				this.eventStore(events[0]);
			}
		});
		this.checkUrl();
		this.heartbeat();
	}
	checkUrl() {
		const page = window.location.href;
		const query = parseUrlQuery(page);
		if (query['_r_d_'] && query['_r_c_k_']) {
			this.verifyReady = true;
			this.domain = query['_r_d_'];
			this.key = query['_r_c_k_']
			this.checkCache();
		} else {
			this.collector.off('submit-verify-h5')
		}
	}
	checkCache() {
		if (!this.eventStorage.length) return;
		this.postVerify(this.eventStorage);
	}
	heartbeat() {
		this.heart = setInterval(() => {
			const event = {
				event: 'simulator_test__',
				local_time_ms: Date.now(),
			};
			let { header, user } = this.collector.configManager.get();
			const Data = {
				events: [event],
				user,
				header,
			};
			this.eventStore(Data);
		}, 1000 * 60)
	}
	eventStore(events: any) {
		if (this.cleanStatus) return;
		if (this.verifyReady) {
			this.postVerify(events);
		} else {
			this.eventStorage.push(events);
		}
	}
	cleanVerify() {
		this.cleanStatus = true;
		this.eventStorage = [];
		clearInterval(this.heart);
	}
	postVerify(events: any) {
		try {
			const _events = JSON.parse(JSON.stringify(events));
			if (isArray(events)) {
				_events.forEach(item => {
					this.fetchLog(item);
				})
			} else {
				this.fetchLog(_events);
			}
		} catch (e) {
			console.log('web verify post error ~');
		}
	}
	fetchLog(data: any) {
		fetch(`${this.domain}/simulator/h5/log?connection_key=${this.key}`, data, 20000, false);
	}
	leave() {
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') {
				this.cleanVerify();
			}
		})
		beforePageUnload(() => {
			this.cleanVerify();
		})
	}
}