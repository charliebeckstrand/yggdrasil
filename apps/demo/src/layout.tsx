import { raw } from 'hono/html'
import type { Child } from 'hono/jsx'

export type LayoutProps = {
	title?: string
	children: Child
}

const livereloadScript = raw(`<script>
(function(){
	var v = null

	setInterval(function(){
		fetch('/__livereload').then(function(r){ return r.json() }).then(function(d){
			if (v !== null && d.version !== v) location.reload()

			v = d.version
		}).catch(function(){
			v = null
		})
	}, 500)
})()
</script>`)

export function Layout({ title, children }: LayoutProps) {
	const isDev = process.env.NODE_ENV !== 'production'

	return (
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>{title ?? 'Demo'}</title>
				<link rel="stylesheet" href="/styles.css" />
			</head>

			<body class="min-h-screen bg-gray-50 flex items-center justify-center">
				{children}
				{isDev && livereloadScript}
			</body>
		</html>
	)
}
