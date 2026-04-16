import { defineConfig } from 'vite';
import { ember, esBuildResolver } from '@embroider/vite';
import { typescriptConfig } from '@nativescript/vite/typescript';
import { babelPlugin } from "@warp-drive/core/build-config";
import module from 'node:module';
import type { Plugin } from 'esbuild';

// Optional dependencies that should be marked as external
const optionalDependencies = [
  'bufferutil',
  'utf-8-validate',
  'supports-color',
  'ember-source',
  'ember-native-devtools',
];

// Custom esbuild plugin to resolve node modules before esBuildResolver
const nodeModuleResolver = (): Plugin => ({
  name: 'node-module-resolver',
  setup(build) {
    // Handle all imports to check if they're node modules
    build.onResolve({ filter: /.*/ }, (args) => {
      // Skip relative and absolute paths
      if (args.path.startsWith('.') || args.path.startsWith('/')) {
        return null;
      }

      let moduleName = args.path;

      // Strip node: prefix if present
      if (moduleName.startsWith('node:')) {
        moduleName = moduleName.replace(/^node:/, '');
      }

      // Check if it's an optional dependency
      if (optionalDependencies.includes(moduleName)) {
        return {
          path: moduleName,
          external: true,
        };
      }

      // Check if it's a built-in module using module.builtinModules
      if (module.builtinModules?.includes(moduleName)) {
        return {
          path: moduleName,
          external: true,
        };
      }

      // Let the next resolver (esBuildResolver) handle it
      return null;
    });
  },
});


export default defineConfig(({ mode }) => {
  const isDevMode = mode === 'development';
  const platform = 'android'; // Can be made dynamic based on CLI flags

  const config = typescriptConfig({ mode }, {
    esbuildPlugins: [
      nodeModuleResolver(),
      esBuildResolver()
    ]
  });

  return {
    ...config,
    plugins: [
      ...ember(),
      ...config.plugins,
    ],
  };
});
