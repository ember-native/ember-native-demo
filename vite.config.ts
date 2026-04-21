import { defineConfig } from 'vite';
import { ember, esBuildResolver, extensions } from '@embroider/vite';
import { babel } from "@rollup/plugin-babel";
import { typescriptConfig } from '@nativescript/vite/typescript';
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

// Packages with CJS/ESM interop issues that should be external
const externalPackages = [
  '@asamuzakjp/css-color',
  '@csstools/css-calc',
  '@csstools/css-color-parser',
  '@csstools/css-parser-algorithms',
  '@csstools/css-tokenizer',
  'lru-cache',
  'cssstyle',
  'jsdom',
  'happy-dom',
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

      // Check if it's a package with CJS/ESM interop issues
      if (externalPackages.some(pkg => moduleName === pkg || moduleName.startsWith(pkg + '/'))) {
        return {
          path: args.path,
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
      {
        enforce: 'pre',
        resolveId(id) {
          if (id.startsWith('node:')) {
            return id;
          }
          if (module.builtinModules?.includes(id)) {
            return id;
          }
        }
      },
      ...ember(),
      ...config.plugins,
      babel({
        babelHelpers: "runtime",
        extensions,
      }),
    ],
    optimizeDeps: {
      exclude: [
        ...externalPackages,
        ...optionalDependencies,
      ],
    },
    ssr: {
      external: [
        ...externalPackages,
        ...optionalDependencies,
      ],
      noExternal: false,
    },
  };
});
