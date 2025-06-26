import {defineConfig} from 'vite'
import autoprefixer from 'autoprefixer'

export default defineConfig({
	css: {
		postcss: {
			plugins: [
				autoprefixer({
					overrideBrowserslist: [
						'> 1%',
						'last 2 versions',
						'not dead',
						'not ie 11',
					],
				}),
			],
		},
	},
	build: {
		outDir: 'dist',
		assetsDir: 'assets',
		sourcemap: true,
		rollupOptions: {
			input: {
				main: './index.html',
			},
		},
	},
	server: {
		port: 3000,
		open: true,
		watch: {
			usePolling: true,
			include: ['src/**/*', 'resume.json', 'template.config.js'],
		},
	},
	resolve: {
		alias: {
			'@': '/src',
			'@styles': '/src/styles',
			'@scripts': '/src/scripts',
			'@templates': '/src/templates',
			'@config': '/template.config.js',
		},
	},
})
