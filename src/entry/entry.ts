// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.
import collector from "../collect/collect"
import Ab from '../plugin/ab/ab'
import Stay from '../plugin/stay/stay'
import Profile from '../plugin/profile/profile'
import HeartBeat from '../plugin/heartbeat/heartbeat'
import Monitor from '../plugin/monitor/index'
import Autotrack from '../plugin/track/index'
import Verify from "../plugin/verify/verify"
import RuotePage from '../plugin/route/route'

collector.usePlugin(Ab, 'ab')
collector.usePlugin(Stay, 'stay')
collector.usePlugin(Autotrack, 'autotrack')
collector.usePlugin(Verify, 'verify')
collector.usePlugin(Profile, 'profile')
collector.usePlugin(HeartBeat, 'heartbeat')
collector.usePlugin(Monitor, 'monitor')
collector.usePlugin(RuotePage, 'route')

const SDK = new collector('default')
export const Collector = collector
export default SDK