import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  babelCompatSupport,
  templateCompatSupport,
} from '@embroider/compat/babel';
import { hotAstProcessor } from 'ember-vite-hmr/lib/babel-plugin';
import { babelPlugin } from "@warp-drive/core/build-config";


const warpDriveMacros = babelPlugin({
  compatWith: '5.6',
  env: {
    DEBUG: process.env.DEBUG || false,
  },
});


export default {
  sourceType: 'module',
  plugins: [
    [
      '@babel/plugin-transform-typescript',
      {
        allExtensions: true,
        onlyRemoveTypeImports: true,
        allowDeclareFields: true,
      },
    ],
    [
      'babel-plugin-ember-template-compilation',
      {
        enableLegacyModules: [
          'ember-cli-htmlbars',
          'ember-cli-htmlbars-inline-precompile',
          'htmlbars-inline-precompile',
        ],
        transforms: [...templateCompatSupport(), hotAstProcessor.transform],
      },
    ],
    [
      'module:decorator-transforms',
      {
        runtime: {
          import: resolve('node_modules', 'decorator-transforms', 'dist', 'runtime.js'),
        },
      },
    ],
    [
      '@babel/plugin-transform-runtime',
      {
        absoluteRuntime: dirname(fileURLToPath(import.meta.url)),
        useESModules: true,
        regenerator: false,
      },
    ],
    ...babelCompatSupport()
      .filter(x => !(x[0] || x).includes('macros-babel-plugin.js'))
      .filter(x => !(x[0] || x).includes('babel-plugin-cache-busting.js')),
    ...warpDriveMacros.js,
  ],

  generatorOpts: {
    compact: false,
  },
};
