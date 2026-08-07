// `ember-native`'s package.json only maps declarations for the `"./*"`
// exports pattern, not the more specific `"./utils/*"` one this subpath
// resolves through - so TypeScript can't find types for it on its own.
// See `node_modules/ember-native/dist/utils/nativescript-vite.config.js`
// for the JSDoc this mirrors.
declare module 'ember-native/utils/nativescript-vite.config.js' {
  import type { Plugin, UserConfig } from 'vite';

  interface ConfigureNativeScriptViteOptions {
    mode: string;
    mergeConfig: (base: UserConfig, override: UserConfig) => UserConfig;
    typescriptConfig: (args: { mode: string }) => UserConfig;
    entry: string;
    hmr?: () => Plugin;
    require?: (id: string) => string;
    hmrHost?: string;
    vendorExclude?: string[];
    babel?: object;
    plugins?: Plugin[];
    extend?: UserConfig;
  }

  export default function configureNativeScriptVite(options: ConfigureNativeScriptViteOptions): UserConfig;
}
