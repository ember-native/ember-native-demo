import { defineConfig } from 'vite';
import { ember, esBuildResolver, extensions } from '@embroider/vite';
import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { typescriptConfig } from '@nativescript/vite/typescript';
import module from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'esbuild';
import type { Plugin as VitePlugin } from 'vite';
import * as fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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

// Custom Vite plugin to convert json-to-ast from CommonJS to ESM
const jsonToAstEsmLoader = (): VitePlugin => ({
  name: 'json-to-ast-esm-loader',
  enforce: 'pre',

  resolveId(id) {
    // Intercept json-to-ast imports
    if (id === 'json-to-ast') {
      return id;
    }
    return null;
  },

  load(id) {
    // Handle json-to-ast module loading
    if (id === 'json-to-ast') {
      try {
        // Resolve the actual file path
        const resolvedPath = require.resolve('json-to-ast');
        const code = fs.readFileSync(resolvedPath, 'utf-8');

        // Simple wrapper approach: wrap UMD code with exports object
        const esmCode = `const exports = {};\nconst module = { exports };\n${code}\nexport default module.exports;`;

        return {
          code: esmCode,
          map: null
        };
      } catch (error) {
        console.warn(`Failed to transform json-to-ast: ${error}`);
        return null;
      }
    }
    return null;
  }
});

export default defineConfig(({ mode }) => {
  const isDevMode = mode === 'development';
  const platform = 'android'; // Can be made dynamic based on CLI flags

  const config = typescriptConfig({ mode }, {
    esbuildPlugins: [
      nodeModuleResolver(),
      esBuildResolver(),
      {
        name: 'unicode-regex-transform',
        setup(build) {
          build.onLoad({ filter: /\.(js|ts|jsx|tsx|mjs)$/ }, async (args) => {
            const fs = await import('fs');
            let contents = await fs.promises.readFile(args.path, 'utf8');

            // Transform Unicode property escapes to ES2018 compatible regex
            // Replace \p{P} (punctuation) and \p{Sm} (math symbols) with character classes
            contents = contents.replace(
              /\/\^\[\\s\\p\{P\}\\p\{Sm\}\]\*\$\//g,
              '/^[\\s\\u0021-\\u002F\\u003A-\\u0040\\u005B-\\u0060\\u007B-\\u007E\\u00A1-\\u00BF\\u2000-\\u206F\\u2190-\\u21FF\\u2200-\\u22FF]*$/'
            );

            return { contents, loader: 'default' };
          });
        }
      }
    ]
  });

  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        '~': path.resolve(__dirname, 'app'),
      },
    },
    build: {
      ...config.build,
      rollupOptions: {
        ...config.build?.rollupOptions,
        external: [
          // Mark Node.js built-in modules as external - available in NativeScript runtime
          'crypto', 'module', 'fs', 'path', 'os', 'stream', 'http', 'https',
          'zlib', 'util', 'buffer', 'events', 'assert', 'constants', 'url', 'querystring'
        ],
      },
    },
    esbuild: {
      ...config.esbuild,
      target: 'es2018', // ES2018 doesn't support Unicode property escapes
    },
    optimizeDeps: {
      ...config.optimizeDeps,
      esbuildOptions: {
        ...config.optimizeDeps?.esbuildOptions,
        target: 'es2018',
      },
    },
    plugins: [
      jsonToAstEsmLoader(),
      {
        enforce: 'pre',
        resolveId(id, importer, meta) {
          // Handle node: prefix and built-in modules
          if (id && id.startsWith('node:')) {
            return id;
          }
          if (id && module.builtinModules?.includes(id)) {
            return id;
          }
          
          // Let Vite's default resolution handle everything else
          // Avoid calling this.resolve() which can cause "paths[1] must be string" error
          return null;
        }
      },
      ...ember(),
      ...config.plugins,
      commonjs(),
      babel({
        babelHelpers: "runtime",
        extensions,
        include: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx', '**/*.gts', '**/*.gjs', 'node_modules/**'],
        exclude: [],
        plugins: [
          '@babel/plugin-transform-unicode-regex',
          ['@babel/plugin-transform-typescript', {
            onlyRemoveTypeImports: true,
            allowDeclareFields: true,
            isTSX: true
          }]
        ]
      }),
    ],
  };
});
