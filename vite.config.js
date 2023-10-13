import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import pkg from './package.json';
import { svgBuilder } from 'vite-svg-plugin'
import mkcert from 'vite-plugin-mkcert'
import glsl from 'vite-plugin-glsl';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		svgBuilder({ path: './svg/', prefix: '' }),
        glsl(),
		svelte(),
		mkcert()
	],
	build: {
		outDir: 'out',
		lib: {
	  
		  entry: 'src/main.js',
		  name: pkg.name,
		  fileName: f => pkg.name + (f === 'umd' ? '.umd.js' : '.js')
		},
		sourcemap: true,
		// minify: false,
    },
	server: {
		host: '127.0.0.1',
		port: 8080,
		https: true,
	}
})
