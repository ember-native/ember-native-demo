import { defineConfig } from 'vite';
import { ember, esBuildResolver, extensions } from '@embroider/vite';
import { babel } from "@rollup/plugin-babel";
import { typescriptConfig } from '@nativescript/vite/typescript';
import module from 'node:module';
import type { Plugin } from 'esbuild';
import * as fs from "node:fs";
import commonjs from 'vite-plugin-commonjs'


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
        resolveId(id, importer, meta) {
          if (fs.existsSync(id)) {
            id = fs.realpathSync(id);
          }
          if(fs.existsSync(importer)) {
            importer = fs.realpathSync(importer);
          }

          if (id.startsWith('node:')) {
            return id;
          }
          if (module.builtinModules?.includes(id)) {
            return id;
          }
          return this.resolve(id, importer, meta);
        }
      },
      commonjs(),
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
