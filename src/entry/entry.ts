import collector from "../collect/collect"
import Ab from '../plugin/ab/ab'
import Et from '../plugin/et/et'
import Stay from '../plugin/stay/stay'
import Profile from '../plugin/profile/profile'
import HeartBeat from '../plugin/heartbeat/heartbeat'
import Monitor from '../plugin/monitor/index'
import Autotrack from '../plugin/track/index'
import Tracer from '../plugin/tracer/tracer'
import Extend from '../plugin/extend/index'
import Verify from "../plugin/verify/verify"
import RuotePage from '../plugin/route/route'

collector.usePlugin(Extend, 'extend')
collector.usePlugin(Ab, 'ab')
collector.usePlugin(Stay, 'stay')
collector.usePlugin(Autotrack, 'autotrack')
collector.usePlugin(Verify, 'verify')
collector.usePlugin(Et, 'et')
collector.usePlugin(Profile, 'profile')
collector.usePlugin(HeartBeat, 'heartbeat')
collector.usePlugin(Monitor, 'monitor')
collector.usePlugin(RuotePage, 'route')
collector.usePlugin(Tracer, 'tracer')

const Tea = new collector('default')
export const Collector = collector
export default Tea