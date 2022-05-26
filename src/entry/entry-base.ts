import collector from "../collect/collect"
import Et from '../plugin/et/et'
import Profile from '../plugin/profile/profile'
import HeartBeat from '../plugin/heartbeat/heartbeat'
import Monitor from '../plugin/monitor/index'
import Verify from "../plugin/verify/verify"
import Extend from '../plugin/extend/index'

collector.usePlugin(Extend, 'extend')
collector.usePlugin(Verify, 'verify')
collector.usePlugin(Et, 'et')
collector.usePlugin(Profile, 'profile')
collector.usePlugin(HeartBeat, 'heartbeat')
collector.usePlugin(Monitor, 'monitor')

const Tea = new collector('default')
export const Collector = collector
export default Tea