# Build Failure Investigation - PR #156

## Issue
Build fails with error:
```
ERROR in ./node_modules/.pnpm/@nativescript+core@9.0.18/node_modules/@nativescript/core/ui/core/bindable/bindable-expressions.js 236:20-25
export 'parse' (imported as 'parse') was not found in 'acorn' (module has no exports)
```

## Root Cause
The upgrade from `@nativescript/core@8.9.7` to `9.0.18` introduced a breaking change:

1. **@nativescript/core@9.0.18** uses ES6 import syntax:
   - `import { parse } from 'acorn';` in bindable-expressions.js
   
2. **acorn@8.16.0** package structure may not properly export named exports for webpack

3. **Working setup** (ember-native/ember-native demo-app):
   - Uses `@nativescript/core@8.9.7` (NOT 9.0.18)
   - This version is compatible with current build tooling

## Recommended Solutions

### Option 1: Revert to 8.9.x (Safest)
Revert `@nativescript/core` to `~8.9.7` range until 9.0.x compatibility is resolved.

### Option 2: Add acorn resolution
Add to package.json:
```json
"pnpm": {
  "overrides": {
    "acorn": "^8.16.0"
  }
}
```

### Option 3: Wait for upstream fix
Wait for @nativescript/core@9.0.x to fix acorn import compatibility.

## Comparison with Working Setup

| Package | This PR | Working demo-app |
|---------|---------|------------------|
| @nativescript/core | ~9.0.18 | ~8.9.7 |
| @nativescript/webpack | ^5.0.31 | ^5.0.31 |
| acorn | 8.16.0 | N/A (not direct dep) |

## Recommendation
**Reject this PR** or revert @nativescript/core to 8.9.x range. The 9.0.x upgrade introduces breaking changes that are not compatible with the current build setup.
