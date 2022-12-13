// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.
import collector from "../collect/collect"
import Profile from '../plugin/profile/profile'
import HeartBeat from '../plugin/heartbeat/heartbeat'
import Monitor from '../plugin/monitor/index'
import Verify from "../plugin/verify/verify"
import VerifyH from "../plugin/verify/verify_h5"


collector.usePlugin(Verify, 'verify')
collector.usePlugin(VerifyH, 'verifyH')
collector.usePlugin(Profile, 'profile')
collector.usePlugin(HeartBeat, 'heartbeat')
collector.usePlugin(Monitor, 'monitor')

const SDK = new collector('default')
export const Collector = collector
export default SDK