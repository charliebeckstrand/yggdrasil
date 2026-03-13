import { Route, Routes } from 'react-router-dom'

import type { SSRData } from '@/lib/types'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

interface AppProps {
	ssrData?: SSRData
}

export function App({ ssrData }: AppProps) {
	return (
		<Routes>
			<Route path="/" element={<DashboardPage />} />
			<Route path="/login" element={<LoginPage ssrData={ssrData} />} />
			<Route path="/register" element={<RegisterPage ssrData={ssrData} />} />
		</Routes>
	)
}
