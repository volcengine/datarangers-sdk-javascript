// Copyright 2022 Beijing Volcanoengine Technology Ltd. All Rights Reserved.
export const getNameSpace = () => {
	if (typeof window !== 'undefined') {
		return window['LogAnalyticsObject']
	}
}


export const getLogPluginSpace = () => {
	if (typeof window !== 'undefined') {
		if (!window['LogPluginObject']) {
			window['LogPluginObject'] = {}
		}
		return window['LogPluginObject']
	} else {
		return null
	}
}