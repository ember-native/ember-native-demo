import { defineConfig } from 'vite';
import { ember, esBuildResolver } from '@embroider/vite';
import path from 'path';
import { readFileSync } from 'fs';

export default defineConfig(({ mode }) => {
  const isDevMode = mode === 'development';
  const platform = 'android'; // Can be made dynamic based on CLI flags

  return {
    plugins: [
      ember(),
    ],
    resolve: {
      extensions: ['.android.ts', '.android.js', '.ts', '.js', '.mjs', '.json'],
      dedupe: [
        'ember-source',
        '@glimmer/component',
        '@glimmer/tracking',
        '@nativescript/core',
      ],
    },
    optimizeDeps: {
      exclude: [
        '@nativescript/core',
        '@ember/component',
        '@ember/debug',
        '@ember/destroyable',
        '@ember/runloop',
        '@ember/owner',
        '@ember/service',
        '@ember/object',
        '@ember/application',
        '@ember/routing',
        '@ember/test-helpers',
        '@ember/test-waiters',
        '@glimmer/component',
        '@glimmer/tracking',
        '@glimmer/validator',
        'ember-source',
        'ember-modifier',
        '@warp-drive/core',
        '@warp-drive/json-api',
        '@warp-drive/core-types',
        '@embroider/macros',
      ],
      esbuildOptions: {
        plugins: [esBuildResolver()],
        target: 'es2020',
        define: {
          global: 'globalThis',
          'process.env.NODE_ENV': JSON.stringify(mode),
        },
      },
    },
    esbuild: {
      target: 'es2020',
      keepNames: true,
    },
    server: isDevMode ? {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      cors: true,
    } : {},
    build: {
      target: 'es2020',
      minify: mode === 'production',
    },
  };
});
