# PR #156 investigation: NativeScript core 9 build failure

Branch: `dependabot/npm_and_yarn/nativescript/core-9.0.4`

## Context

Reported CI failure:

```text
ERROR in ./node_modules/.pnpm/@NativeScript+core@9.0.18/node_modules/@nativescript/core/ui/core/bindable/bindable-expressions.js 236:20-25
export 'parse' (imported as 'parse') was not found in 'acorn' (module has no exports)
```

This PR updates:

- `@nativescript/core` from `8.9.7` to `9.0.18`
- `@nativescript/webpack` from `5.0.24` to `^5.0.31` (resolved in lockfile to `5.0.33`)

## What I checked

- Reviewed the PR diff: only `package.json`, `pnpm-lock.yaml`, and `webpack.config.js` changed.
- Tried `pnpm build` in this CI workspace.
- Build could not be fully reproduced locally here because `node_modules` is not installed in this environment:
  - `nativescript: not found`
  - `pnpm` warned that local `package.json` exists but `node_modules` is missing
- Inspected published metadata:
  - `@nativescript/core@9.0.18` declares dependency on `acorn@^8.15.0`
  - current npm metadata for `acorn` points to:
    - CommonJS: `dist/acorn.js`
    - ESM: `dist/acorn.mjs`
- The current `webpack.config.js` already contains this workaround:
  - `config.resolve.alias.set('acorn', require.resolve('acorn'));`

## Likely issue

The failure strongly suggests webpack is resolving `acorn` to a module shape with no named ESM exports in the bundle path used by `@nativescript/core/ui/core/bindable/bindable-expressions.js`.

Because the existing alias points to `require.resolve('acorn')`, it may resolve to the CommonJS entry (`dist/acorn.js`) instead of the ESM entry (`dist/acorn.mjs`), which would explain:

- NativeScript code importing `parse` as a named export
- webpack reporting that `acorn` has no exports

## Suggested next step

Try a narrower webpack alias that forces the ESM build of acorn instead of the package root:

```js
config.resolve.alias.set('acorn$', require.resolve('acorn/dist/acorn.mjs'));
```

If that does not work, test a package override/pin combination that keeps `@nativescript/core` and `@nativescript/webpack` on a known-compatible pair, then rerun CI.

## Status at stop time

No safe code fix was committed yet because I could not validate a build in this workspace without installed dependencies. This file is added so the next pass can continue with a concrete hypothesis and minimal next action.
