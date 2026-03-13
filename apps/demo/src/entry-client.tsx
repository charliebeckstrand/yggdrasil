import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { App } from './App'
import type { SSRData } from './lib/types'
import './styles.css'

const root = document.getElementById('app')

if (!root) throw new Error('Root element not found')

const ssrData = (window as unknown as { __SSR_DATA__?: SSRData }).__SSR_DATA__

hydrateRoot(
	root,
	<StrictMode>
		<BrowserRouter>
			<App ssrData={ssrData} />
		</BrowserRouter>
	</StrictMode>,
)
