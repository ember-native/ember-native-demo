import { tagForProperty } from '@ember/-internals/metal';
import { _backburner } from '@ember/runloop';
import { consumeTag, createCache, dirtyTag, getValue, DirtyableTag } from '@glimmer/validator';
import { setupSignals } from '@warp-drive/core/configure';
import type { SignalHooks } from '@warp-drive/core/configure';

type Tag = ReturnType<typeof tagForProperty>;

export function buildSignalConfig(): SignalHooks {
  return {
    createSignal(obj: object, key: string | symbol): Tag {
      return tagForProperty(obj, key);
    },
    
    consumeSignal(signal: Tag) {
      consumeTag(signal);
    },
    
    notifySignal(signal: DirtyableTag) {
      dirtyTag(signal);
    },
    
    createMemo: <F>(object: object, key: string | symbol, fn: () => F): (() => F) => {
      const memo = createCache(fn);
      return () => getValue(memo);
    },
    
    willSyncFlushWatchers: () => {
      return !!_backburner.currentInstance && (_backburner as any)._autorun !== true;
    }
  } satisfies SignalHooks;
}

setupSignals(buildSignalConfig);
