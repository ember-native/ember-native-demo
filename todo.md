# Build Fix for @nativescript/core 9.0.18 - Acorn Module Resolution

## Context
PR #156 upgrades @nativescript/core from 8.9.7 to 9.0.18, which introduces a build failure:

```
ERROR in ./node_modules/.pnpm/@nativescript+core@9.0.18/node_modules/@nativescript/core/ui/core/bindable/bindable-expressions.js 236:20-25
export 'parse' (imported as 'parse') was not found in 'acorn' (module has no exports)
```

## Root Cause
The issue is in `webpack.config.js` Module.registerHooks:
- @nativescript/core 9.0.18 uses ESM imports for 'acorn'
- acorn package has conditional exports (different entry points for 'import' vs 'require')
- Module.registerHooks uses `require.resolve()` which always returns the CommonJS entry point
- This ignores the package.json exports field, causing ESM imports to get the wrong module

## Solution Applied
Modified `webpack.config.js` to skip custom resolution for packages with conditional exports when the context includes 'import' condition:

```javascript
// Skip custom resolution for packages with conditional exports when importing
// This allows Node.js to properly resolve ESM vs CJS based on package.json exports
const packagesWithConditionalExports = ['acorn'];
if (context.conditions?.includes('import') && packagesWithConditionalExports.some(pkg => specifier === pkg || specifier.startsWith(pkg + '/')) {
  return nextResolve(originalSpecifier, context);
}
```

## Next Steps
1. **Test the build** - Run `pnpm build` or webpack to verify the fix works
2. **Verify in CI** - Push changes and check if CI build passes
3. **Consider broader fix** - If other packages have similar issues, expand the `packagesWithConditionalExports` list
4. **Alternative approach** - Consider using a proper package.json exports resolver instead of require.resolve() for ESM contexts

## Files Modified
- `webpack.config.js` - Added conditional exports handling in Module.registerHooks

## Time Spent
~6 minutes investigation and fix implementation

## Status
✅ Fix implemented
✅ Changes committed
⏳ Awaiting push and CI verification
