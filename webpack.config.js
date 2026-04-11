const fs = require('fs');
const path = require('path');
var Module = require('module');
var { fileURLToPath, pathToFileURL } = require('node:url');

Module.registerHooks({
  resolve: (specifier, context, nextResolve) => {
    //do your thing here
    const originalSpecifier = specifier;
    if(context.parentURL && fileURLToPath(context.parentURL).includes('node:'))
      return nextResolve(specifier, context);

    // Helper function to try resolving with platform-specific extensions
    const tryResolveWithPlatformExtensions = (baseSpecifier, resolvePaths) => {
      // Try original specifier first
      try {
        const resolved = require.resolve(baseSpecifier, resolvePaths ? { paths: resolvePaths } : undefined);
        if (fs.existsSync(resolved)) {
          return resolved;
        }
      } catch (e) {
        // Continue to try platform-specific extensions
      }

      // If original fails, try platform-specific extensions
      // NativeScript uses .android.js, .ios.js, .android.ts, .ios.ts
      const platformExtensions = ['.android.js', '.ios.js', '.android.ts', '.ios.ts'];
      
      for (const ext of platformExtensions) {
        try {
          const platformSpecifier = baseSpecifier + ext;
          const resolved = require.resolve(platformSpecifier, resolvePaths ? { paths: resolvePaths } : undefined);
          if (fs.existsSync(resolved)) {
            return resolved;
          }
        } catch (e) {
          // Continue trying other extensions
        }
      }
      
      return null;
    };

    if (context.parentURL) {
      const parentURL = fs.realpathSync(fileURLToPath(context.parentURL));
      const resolved = tryResolveWithPlatformExtensions(specifier, [path.dirname(parentURL)]);
      
      if (resolved) {
        specifier = fs.realpathSync(resolved);
        if (context.conditions.includes?.('import')) {
          specifier = pathToFileURL(specifier).toString();
        }
        return nextResolve(specifier, context);
      }
    }

    const resolved = tryResolveWithPlatformExtensions(specifier, null);
    if (resolved) {
      specifier = fs.realpathSync(resolved);
      if (context.conditions.includes?.('import')) {
        specifier = pathToFileURL(specifier).toString();
      }
      return nextResolve(specifier, context);
    }

    return nextResolve(originalSpecifier, context);
  }
});

const webpack = require('@nativescript/webpack');
const configureEmberNative = require('ember-native/utils/webpack.config.js');

module.exports = (env) => {
  webpack.init(env);

  process.env.EMBER_HMR_ENABLED = 'true';

  // Learn how to customize:
  // https://docs.nativescript.org/webpack

  // Use ember-native webpack configuration (includes embroider adapter)
  configureEmberNative(webpack);

  webpack.chainWebpack((config) => {
    // Add .gjs and .gts extensions
    config.resolve.extensions.add('.gjs');
    config.resolve.extensions.add('.gts');

    // Allow extension-less ESM imports (fixes "fully specified" errors)
    // Required for @nativescript/core@9.0.18+ which uses imports without extensions
    config.resolve.set('fullySpecified', false);

    // App-specific aliases
    config.resolve.alias.set('~', '/app');
    config.resolve.alias.delete('@');
  });

  // HMR loaders for routes, controllers, templates
  webpack.chainWebpack((config) => {
    config.module
      .rule('gts/gjs')
      .use('hmr-loader')
      .loader(require.resolve('ember-native/utils/hmr-loader.js'))
      .end();

    config.module
      .rule('js/ts')
      .use('hmr-loader')
      .loader(require.resolve('ember-native/utils/hmr-loader.js'))
      .end();

    // Include test XML files
    const testRootXml = path.dirname(path.resolve('./app/tests/test-root-view.xml'));
    config.module.rule('xml').include.add(testRootXml);

    // Include unit-test-runner XML files
    const unitTestRunnerPath = path.dirname(require.resolve('@nativescript/unit-test-runner/package.json'));
    config.module.rule('xml').include.add(unitTestRunnerPath);
    config.module.rule('xml').include.add(fs.realpathSync(unitTestRunnerPath));
  });

  webpack.chainWebpack((config) => {
    config.plugin('DefinePlugin').tap((args) => {
      Object.assign(args[0], {
        window: 'globalThis',
        __TEST_RUNNER_STAY_OPEN__: !process.env.CI,
        process: {
          browser: true
        }
      });
      return args;
    });
  });

  webpack.chainWebpack((config) => {
    config.externals(
      // make sure to keep pre-defined externals
      config.get('externals').concat([
        // add your own externals
        {
          'ember-compatibility-helpers': 'global globalThis'
        },
      ]),
    );
  });

  webpack.chainWebpack((config) => {
    const fallback = {};
    Object.assign(fallback, {
      "stream": require.resolve("stream-browserify"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "url": require.resolve("url"),
      "querystring": require.resolve("querystring-es3"),
      buffer: require.resolve('buffer'),
      "path": false,
      "tty": false,
      "timers": false,
      "os": false,
      "util": require.resolve("util"),
      "crypto": false,
      "fs": false,
      "tls": false,
      "net": false,
      "zlib": false,
    })
    config.resolve.set('fallback', fallback);
    config.target('node');
  });

  // Configure webpack resolveLoader for pnpm
  webpack.chainWebpack((config) => {
    const nativescriptWebpackPath = fs.realpathSync(path.dirname(require.resolve('@nativescript/webpack/package.json')));

    config.resolveLoader.modules
      .add(path.resolve(__dirname, 'node_modules'))
      .add(path.resolve(nativescriptWebpackPath, '..', '..'))
      .add(path.resolve(nativescriptWebpackPath, 'dist', 'loaders'))
      .end();
  });

  const conf = webpack.resolveConfig();
  return conf;
};
