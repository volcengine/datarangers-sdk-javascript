// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.
import collector from "../collect/collect"
import Et from '../plugin/et/et'

collector.usePlugin(Et, 'et')

const SDK = new collector('default')
export const Collector = collector
export default SDK