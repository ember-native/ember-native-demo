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
  Filed upstream as https://github.com/ember-native/ember-native/issues/408
  (2026-08-04) with the bisection pointer to `cdd299f` - a PR wasn't opened
  since the root cause isn't confirmed yet (crash happens before any JS runs,
  points at CLI/native module-loader behavior, not Vite config content). Check
  that issue for updates before re-investigating.
- The Android emulator (`emulator-5554`) on this machine is shared with other
  concurrent agent sessions/apps (e.g. `org.pjp.gitonlinehelper` was seen
  running there too) - expect noisy/slow installs and occasional resource
  contention; don't assume a slow or stalled install means your build is broken.

## PR #218 CI analysis (2026-08-04, re: the `vendor.mjs` crash above)

Checked `ember-native`'s own memory/`ember-native-todo.md` (in the separate
`~/IdeaProjects/todos` repo) for issue #408's status: **ember-native's own
investigation superseded the `cdd299f` bisection above** - the real root
cause was actually the `@ember/test-helpers` globals-banner commit (two
boot-order bugs: a `document` stub missing `createElement`, and a CJS
`module.exports` leak in a CLI-regenerated test file), fixed and verified
with `TOTAL: 7 SUCCESS`, squash-merged to `main` 2026-08-01, and published as
`ember-native@5.0.0` on npm 2026-08-02. **This repo's `pnpm-lock.yaml`
already resolves to `ember-native@5.0.0`, and the installed
`node_modules/ember-native/dist/utils/vite.config.js` was confirmed
(2026-08-04) to already contain that exact fix** (`earlyGlobalsBanner()`
with the `createElement` stub) - so bumping the version again won't help.

**Despite that, PR #218's `test app` CI job still hit the identical crash**
(confirmed from the actual job log, run `30908531229`, 2026-08-04): the app
still crashes on boot with the same generic `Module evaluation promise
rejected: vendor.mjs` message even with the fix present. Since the message
is contentless by design (thrown before any JS body executes), this is
either a genuine regression in `ember-native@5.0.0` vs. what was verified
pre-release, or a *different* exception during `vendor.mjs` evaluation
producing the same generic wrapper text - possibly related to this app's
extra native UI deps (`nativescript-ui-listview`, `nativescript-ui-
sidedrawer`) that `ember-native`'s own `demo-app` doesn't use and so
wouldn't have been covered by upstream's own verification. Not yet
root-caused - next session should bisect with those two packages excluded
from the test bundle to check if they're implicated, and check
`ember-native-todo.md`/issue #408 for updates first.

**Separately, and more urgently: after the crash, the CI job hangs for the
full 6-hour GitHub Actions max instead of failing fast.** The device-side
log shows the unit-test-runner actually catches the crash and logs
`NSUTR: completed test run.` right away, but the `nativescript test
android` CLI process never exits - a different flavor of the
already-once-fixed "hangs forever after `TOTAL: N SUCCESS`" karma bug
(this one on the crash path instead of the success path, so the earlier
launcher-id fix doesn't cover it). **Mitigated 2026-08-04** by adding
`timeout-minutes: 30` to the `test` job in
`.github/workflows/app-test.yml`, so a future occurrence fails in ~30min
instead of burning 6 hours of CI - this does not fix the underlying crash
or hang, just bounds the cost of hitting either one again.

Did not comment on/reopen discussion on upstream issue #408 or push further
fixes into `ember-native` itself from this session - flagging here for a
human/next session to decide whether to escalate upstream with this
fresh reproduction evidence.
