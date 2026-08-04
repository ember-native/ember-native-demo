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
- `pnpm test` (on-device QUnit via `nativescript.test.vite.config.ts` +
  `vite.test.config.ts`) currently **crashes on launch** with a generic
  `com.tns.NativeScriptException: Cannot instantiate module bundle.mjs / Error:
  Module evaluation promise rejected: vendor.mjs` - no further detail in logcat.
  This reproduces **identically in `ember-native`'s own upstream `demo-app`**
  (same crash, same generic message, confirmed by running its `pnpm test` from
  a clean state on 2026-08-04), so it is a pre-existing, still-open upstream
  issue in `ember-native`'s Vite test-bundling pipeline, not something this
  app's migration introduced - see `VITE_MIGRATION_NOTES.md`'s later
  "Follow-up session" entries (search for "Module evaluation promise rejected"
  and "cdd299f") for the debugging trail so far. Don't re-diagnose from
  scratch; pick up where that document leaves off, or check whether a newer
  `ember-native` release has since fixed it (`npm view ember-native versions`).
- The Android emulator (`emulator-5554`) on this machine is shared with other
  concurrent agent sessions/apps (e.g. `org.pjp.gitonlinehelper` was seen
  running there too) - expect noisy/slow installs and occasional resource
  contention; don't assume a slow or stalled install means your build is broken.
