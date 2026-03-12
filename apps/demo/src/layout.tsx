import { raw } from 'hono/html'
import type { Child } from 'hono/jsx'

export type LayoutProps = {
	title?: string
	children: Child
}

const livereloadScript = raw(`<script>
(function(){
	var link = document.querySelector('link[href^="/styles.css"]')
	if (!link) return
	var last = ''
	setInterval(function(){
		fetch('/styles.css', { method: 'HEAD' }).then(function(r){
			var cl = r.headers.get('content-length') || ''
			if (last && cl !== last) {
				link.href = '/styles.css?' + Date.now()
			}
			last = cl
		}).catch(function(){})
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
