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
import VerifyH from "../plugin/verify/verify_h5"
import Store from "../plugin/store/store"
import TrackDuration from "../plugin/duration/duration"

collector.usePlugin(Ab, 'ab')
collector.usePlugin(Stay, 'stay')
collector.usePlugin(Store, 'store')
collector.usePlugin(Autotrack, 'autotrack')
collector.usePlugin(TrackDuration, 'trackDuration')
collector.usePlugin(Verify, 'verify')
collector.usePlugin(VerifyH, 'verify')
collector.usePlugin(Profile, 'profile')
collector.usePlugin(HeartBeat, 'heartbeat')
collector.usePlugin(Monitor, 'monitor')
collector.usePlugin(RuotePage, 'route')

const Tea = new collector('default')
export const Collector = collector
export default Tea