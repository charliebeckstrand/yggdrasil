import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from './views/DashboardView.vue'
import LoginView from './views/LoginView.vue'
import RegisterView from './views/RegisterView.vue'

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			component: DashboardView,
		},
		{
			path: '/login',
			component: LoginView,
		},
		{
			path: '/register',
			component: RegisterView,
		},
	],
})
