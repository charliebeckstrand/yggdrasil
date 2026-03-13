import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'

import type { SSRData } from '@/lib/types'
import { App } from './App'

export function render(url: string, ssrData: SSRData = {}) {
	const html = renderToString(
		<StrictMode>
			<StaticRouter location={url}>
				<App ssrData={ssrData} />
			</StaticRouter>
		</StrictMode>,
	)

	return html
}
