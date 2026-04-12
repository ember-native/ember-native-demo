const fs = require('fs');
const path = require('path');
var Module = require('module');
var { fileURLToPath, pathToFileURL } = require('node:url');

Module.registerHooks({
  resolve: (specifier, context, nextResolve) => {
    const originalSpecifier = specifier;
    if(context.parentURL && fileURLToPath(context.parentURL).includes('node:')) return nextResolve(specifier, context);

    if (context.parentURL) {
      const parentURL = fs.realpathSync(fileURLToPath(context.parentURL));
      try {
        const resolved = require.resolve(specifier, { paths: [path.dirname(parentURL)] });
        if (fs.existsSync(resolved)) {
          specifier = fs.realpathSync(resolved);
          if (context.conditions.includes?.('import')) {
            specifier = pathToFileURL(specifier).toString();
          }
        }
        return nextResolve(specifier, context);
      } catch (e) {
        //console.log('failed to resolve', specifier,' from ', parentURL, e);
      }
    }
    try {
      const resolved = require.resolve(specifier);
      if (fs.existsSync(resolved)) {
        specifier = fs.realpathSync(resolved);
        if (context.conditions.includes?.('import')) {
          specifier = pathToFileURL(specifier).toString();
        }
      }
      return nextResolve(specifier, context);
    } catch (e) {
      // console.log('failed to resolve', specifier, e);
    }

    return nextResolve(originalSpecifier, context);
  }
});

const webpack = require('@nativescript/webpack');
const webpackLib = require('webpack');
const configureEmberNative = require('ember-native/utils/webpack.config.js');

/**
 * Cache for resolved ESM paths to avoid repeated lookups
 */
const esmPathCache = new Map();

/**
 * Generic helper to resolve ESM entry point for packages with conditional exports
 * @param {string} packageName - The package name to resolve
 * @returns {string|null} - The resolved ESM path or null if not found
 */
function resolveESMEntry(packageName) {
  if (esmPathCache.has(packageName)) {
    return esmPathCache.get(packageName);
  }
  
  try {
    const pkgPath = require.resolve(`${packageName}/package.json`, { paths: [__dirname] });
    const pkgJson = require(pkgPath);
    const pkgDir = path.dirname(pkgPath);
    
    let esmPath = null;
    
    // Check for conditional exports
    if (pkgJson.exports) {
      const mainExport = pkgJson.exports['.'];
      
      // Handle different export formats
      if (typeof mainExport === 'string') {
        esmPath = path.join(pkgDir, mainExport);
      } else if (Array.isArray(mainExport)) {
        // Find import condition in array
        const importEntry = mainExport.find(e => e && e.import);
        if (importEntry && importEntry.import) {
          esmPath = path.join(pkgDir, importEntry.import);
        }
      } else if (typeof mainExport === 'object') {
        // Prefer 'import' over 'module' over 'default'
        const esmField = mainExport.import || mainExport.module || mainExport.default;
        if (esmField) {
          esmPath = path.join(pkgDir, esmField);
        }
      }
    }
    
    // Fallback to 'module' field
    if (!esmPath && pkgJson.module) {
      esmPath = path.join(pkgDir, pkgJson.module);
    }
    
    esmPathCache.set(packageName, esmPath);
    return esmPath;
  } catch (e) {
    esmPathCache.set(packageName, null);
    return null;
  }
}

/**
 * Universal ESM resolver plugin that automatically handles any package with conditional exports
 * No package names needed - works for all packages dynamically
 * @param {string[]} contextPatterns - Patterns to match in resource.context (e.g., ['@nativescript/core'])
 */
function createUniversalESMResolverPlugin(contextPatterns = ['@nativescript/core']) {
  return [
    // Match any bare module import (no relative paths)
    /^[^./]/,
    (resource) => {
      // Only process imports from specified contexts
      if (!resource.context || !contextPatterns.some(pattern => resource.context.includes(pattern))) {
        return;
      }
      
      // Extract package name from request (handle scoped packages)
      const packageName = resource.request.startsWith('@') 
        ? resource.request.split('/').slice(0, 2).join('/')
        : resource.request.split('/')[0];
      
      // Skip @nativescript packages - they handle their own resolution
      if (packageName.startsWith('@nativescript')) {
        return;
      }
      
      // Skip common packages that don't have conditional export issues
      const skipPackages = ['tslib', 'reflect-metadata'];
      if (skipPackages.includes(packageName)) {
        return;
      }
      
      // Try to resolve ESM entry point
      const esmPath = resolveESMEntry(packageName);
      
      // Only replace if:
      // 1. We found an ESM path
      // 2. It's different from the original request
      // 3. The package actually has conditional exports (has 'exports' field)
      if (esmPath && esmPath !== resource.request) {
        try {
          const pkgPath = require.resolve(`${packageName}/package.json`, { paths: [__dirname] });
          const pkgJson = require(pkgPath);
          
          // Only replace if package has conditional exports
          if (pkgJson.exports) {
            resource.request = esmPath;
          }
        } catch (e) {
          // Skip if we can't read package.json
        }
      }
    }
  ];
}

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
    
    // Universal ESM resolution fix - automatically handles ALL packages with conditional exports
    // No need to specify package names - works dynamically for any package
    const pluginConfig = createUniversalESMResolverPlugin(['@nativescript/core']);
    config.plugin('universal-esm-fix').use(webpackLib.NormalModuleReplacementPlugin, pluginConfig);
    
    // Test-specific aliases
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
        { 'ember-compatibility-helpers': 'global globalThis' },
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