import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'org.nativescript.embernativedemo',
  appPath: 'app',
  appResourcesPath: 'App_Resources',
  bundler: 'vite',
  bundlerConfigPath: 'vite.config.ts',
  version: '1.0.0',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none'
  }
} as NativeScriptConfig;
