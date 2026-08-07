# Notes for future todos on this repo

## ember-native 5.x / NativeScript 9 / Vite migration (2026-08-04)

This app was migrated from `ember-native@3.x` + NativeScript 8 + `@nativescript/webpack`
to `ember-native@5.x` + NativeScript 9 + `@nativescript/vite`. If you hit anything
migration-shaped, read `VITE_MIGRATION_NOTES.md` and `NATIVESCRIPT_UPGRADE_NOTES.md`
in the `ember-native` package source (checked out locally at
`~/IdeaProjects/ember-native/ember-native`, with its own `demo-app/` that mirrors
this app's structure almost file-for-file) **before** re-deriving fixes from scratch -
both documents are thousands of lines of hard-won, already-solved root causes for
this exact bundler.

- `ANDROID_HOME`/`ANDROID_SDK_ROOT` are not set in the default shell on this
  machine - export them (`~/Library/Android/sdk`) before running `pnpm build`/
  `pnpm run`/`pnpm test`, or the NativeScript CLI reports a misleading "SDK not
  installed" error even though it's present.
- `pnpm build` / `pnpm run` (the real app, debug or release) build and boot
  cleanly end-to-end on a real emulator - verified 2026-08-04.
- The Android emulator (`emulator-5554`) on this machine is shared with other
  concurrent agent sessions/apps (e.g. `org.pjp.gitonlinehelper` was seen
  running there too) - expect noisy/slow installs and occasional resource
  contention; don't assume a slow or stalled install means your build is broken.
  Seen 2026-08-05: `adb shell` timing out entirely, a 4-minute `adb install`,
  and ~7 minutes between app launch and the test runner's first
  `NSUTR: fetching .../context.json` line, all while the run was perfectly
  healthy. Check `lsof -nP -iTCP:<karma port>` for an ESTABLISHED
  `qemu-system-...` connection before concluding a run is wedged.

## The `Module evaluation promise rejected: vendor.mjs` boot crash - ROOT-CAUSED AND FIXED (2026-08-05)

Historical context: the on-device test path (`pnpm test`) crashed on launch for
weeks with a generic, contentless
`com.tns.NativeScriptException: Cannot instantiate module bundle.mjs / Error:
Module evaluation promise rejected: .../vendor.mjs`. It was filed upstream as
https://github.com/ember-native/ember-native/issues/408 with a (wrong)
bisection pointing at `cdd299f`, and a later session blamed this app's extra
native UI deps. **Both theories were wrong.** The real cause:

- `ember-native@5.0.0`'s `earlyGlobalsBanner()` (in
  `dist/utils/vite.config.js`) prepends a *placeholder* `document` global -
  `{ location: { search: '' }, createElement: () => ({}) }` - to the top of
  **every emitted chunk**, so that `@ember/test-helpers`' top-level
  `document.location` reads don't throw. That fix is real and necessary.
- But making `document` "defined" un-short-circuits every
  `typeof document === 'undefined'` guard in any *other* vendor-bundled
  library. `ember-source@6.9.0` (what this app's lockfile resolved to) still
  ships glimmer's legacy DOM compat detection, which runs at
  `@glimmer/runtime/index.js`'s own module top level:
  `applyTextNodeMergingFix(doc, ...)` does
  `document.createElement('div').appendChild(document.createTextNode('first'))`.
  Against the placeholder that's `({}).appendChild(...)` on a `document` with
  no `createTextNode` - a `TypeError` thrown during `vendor.mjs` evaluation,
  which NativeScript reports only as the generic wrapper message above.
- `ember-source@6.12.0` **deleted** those legacy compat shims
  (`applyTextNodeMergingFix`/`applySVGInnerHTMLFix` no longer exist). That is
  the only reason `ember-native`'s own `demo-app` never reproduced it: it pins
  `^6.12.0`, this app pinned `^6.6.0` and had resolved to 6.9.0.

**Fix applied here**: bumped `ember-source` to `^6.12.0` (matching upstream's
verified `demo-app`). No config, patch, or ember-native change needed.

## The second CI blocker, hidden behind the crash: karma's 2000ms timeouts (2026-08-05)

With the boot crash fixed, the run got as far as
`NSUTR: successfully connected to karma` and then immediately died with
`Disconnected, because no message in 2000 ms`. Cause: `karma.conf.js` had set
`captureTimeout = 2000` and `browserNoActivityTimeout = 2000` (there since the
original 2024 "add unit tests" commit, and dead code for as long as the app
crashed before ever connecting). The device-side runner needs far longer than
2s between connecting and its first message - `app/tests/test-helper.ts`'s
`setupTestContainer()` polls for the test root frame in 1s steps before any
test runs. Raised both to 120000 (upstream's `demo-app` just leaves karma's
defaults). After that: `TOTAL: 6 SUCCESS` on a real emulator, and the CLI
process exits cleanly instead of hanging - verified 2026-08-05.

**Still worth fixing upstream** (not done from this repo): ember-native's
placeholder `document` should be robust enough for any consumer still on
`ember-source < 6.12` - i.e. give it `createTextNode`, `createComment`,
`createElementNS`, and an element stub with `appendChild`/`insertAdjacentHTML`/
`childNodes`. Issue #408's bisection is also still wrong and should be
corrected/closed. Left for a human to decide whether to escalate.

### How to debug the next contentless `vendor.mjs` crash in 10 minutes

The native side swallows the actual JS error, so instrument module evaluation
order and look for the last module that enters but never exits. Add a throwaway
Vite plugin (this is exactly how the above was found):

```js
// vite-plugins/module-trace.mjs - TEMPORARY, do not commit
export function moduleTracePlugin() {
  return {
    name: 'module-trace',
    enforce: 'post',
    transform(code, id) {
      if (id.startsWith('\0')) return null;
      if (!/\.(js|mjs|cjs|ts|gts|gjs)($|\?)/.test(id)) return null;
      const short = JSON.stringify(id.replace(process.cwd(), '.'));
      return { code: `console.log('[TRACE-ENTER] ' + ${short});\n${code}\n;console.log('[TRACE-EXIT] ' + ${short});`, map: null };
    },
  };
}
```

Wire it into `vite.test.config.ts`'s `plugins: [...]`, run `pnpm test`, then
`grep TRACE- <log> | tail`. ESM hoists imports, so a module's `TRACE-ENTER`
only prints after all of its own imports finished - the last unmatched
`TRACE-ENTER` is the module whose body threw.

## CI job hang on the crash path (2026-08-04)

When the app crashed on boot, the device-side runner logged
`NSUTR: completed test run.` immediately but the `nativescript test android`
CLI process never exited, so the `test app` job burned the full 6-hour GitHub
Actions maximum. Mitigated by `timeout-minutes: 30` on the `test` job in
`.github/workflows/app-test.yml`. That bound is still there and still useful:
it does not fix the hang, it just caps the cost if the crash path is ever hit
again.
