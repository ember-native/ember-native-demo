# Ember Native + WarpDrive Knowledge Base

This document provides essential information for AI agents working on this Ember Native project with WarpDrive (Ember Data v5) integration.

## Project Overview

This is an Ember Native application that uses:
- **Ember.js 6.6.0** - Modern Ember framework
- **NativeScript 8.9.x** - Cross-platform mobile framework
- **WarpDrive (Ember Data v5)** - Modern data management layer
- **TypeScript** - Type-safe development
- **Glimmer Components** - Modern component architecture

## WarpDrive Integration

### Official Documentation
- [WarpDrive Guides](https://github.com/emberjs/data/blob/main/guides/index.md)
- [Request Service](https://github.com/emberjs/data/blob/main/guides/requests/index.md)
- [Schema Service](https://github.com/emberjs/data/blob/main/guides/schema/index.md)
- [Cache](https://github.com/emberjs/data/blob/main/guides/cache/index.md)

### Modern WarpDrive (v5) Usage

**IMPORTANT**: This project uses WarpDrive v5 WITHOUT legacy Ember Data support. Do not use:
- `@ember-data/*` packages
- Legacy `Model` classes
- `DS.Model` or `@attr()` decorators
- Old `store.findRecord()` / `store.query()` patterns

### Recommended Store Setup

```typescript
import { useRecommendedStore } from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';

export default class Store extends useRecommendedStore(JSONAPICache) {}
```

### Schema Definition

Schemas MUST include the `identity` field:

```typescript
import { Type } from '@warp-drive/core-types/symbols';

export default {
  [Type]: 'user',
  identity: {
    name: 'id',
    kind: '@id',
  },
  fields: [
    {
      name: 'name',
      kind: 'field',
      type: 'string',
    },
    {
      name: 'email',
      kind: 'field',
      type: 'string',
    },
  ],
};
```

### Signal Hooks Configuration

WarpDrive requires signal hooks for Ember Octane reactivity. Configure in `app/configure-signals.ts`:

```typescript
import { tagForProperty, consumeTag, dirtyTag } from '@ember/-internals/metal';
import { _backburner } from '@ember/runloop';
import { createCache, getValue } from '@glimmer/validator';
import { setupSignals } from '@warp-drive/core';
import type { SignalHooks } from '@warp-drive/core/types';

const SignalHooks: SignalHooks = {
  createSignal: (obj, key) => tagForProperty(obj, key),
  consumeSignal: (tag) => consumeTag(tag),
  notifySignal: (tag) => dirtyTag(tag),
  createMemo: (fn) => createCache(fn),
  willSyncFlushWatchers: () => _backburner.currentInstance !== null,
};

setupSignals(SignalHooks);
```

**CRITICAL**: Import this in `app/app.js` BEFORE app initialization:

```javascript
import './configure-signals';
```

### Data Fetching Pattern

Use the Request API instead of legacy methods:

```typescript
import { service } from '@ember/service';
import type Store from '@warp-drive/core';

export default class MyComponent extends Component {
  @service declare store: Store;

  async loadData() {
    // Modern approach
    const response = await this.store.request({
      url: '/api/users',
      method: 'GET',
    });
    
    return response.content.data;
  }
}
```

## NativeScript Environment Polyfills

NativeScript lacks several Web APIs required by WarpDrive. These are polyfilled in `ember-native/src/setup.ts`:

### Required Polyfills

1. **queueMicrotask**: For async task scheduling
2. **EventTarget**: For event handling
3. **AbortController/AbortSignal**: For request cancellation
4. **ReadableStream**: For streaming data
5. **WritableStream**: For streaming output
6. **TransformStream**: For data transformation

These polyfills are automatically loaded when using `ember-native`.

## Common Issues and Solutions

### CSS Import Errors

**Problem**: `@import '@nativescript/theme/css/core.css'` fails

**Solution**: NativeScript uses a different CSS import system. Remove the `~` prefix if present:

```scss
// Correct
@import '@nativescript/theme/css/core.css';

// Incorrect
@import '~@nativescript/theme/css/core.css';
```

### Babel Macro Errors

**Problem**: `@embroider/macros` not configured

**Solution**: Add to `babel.config.cjs`:

```javascript
plugins: [
  ['@embroider/macros/babel-plugin', { env: 'development' }],
]
```

### TypeScript Errors with WarpDrive

**Problem**: Type errors with store or schemas

**Solution**: 
1. Ensure `@warp-drive/core-types` is installed
2. Add proper type imports:

```typescript
import type Store from '@warp-drive/core';
import type { Type } from '@warp-drive/core-types/symbols';
```

### Signal Hooks Not Working

**Problem**: Reactivity not updating

**Solution**: Verify `configure-signals.ts` is imported FIRST in `app.js`:

```javascript
import './configure-signals'; // MUST be first
import EmberApplication from '@ember/application';
// ... rest of imports
```

## Development Workflow

### Running the App

```bash
# Android
pnpm run

# iOS (macOS only)
pnpm run ios

# Debug mode
pnpm debug
```

### Testing

```bash
# Run tests
pnpm test

# Debug tests
pnpm debug-test
```

### Linting

```bash
# Check all
pnpm lint

# Fix issues
pnpm lint:fix
```

## Project Structure

```
app/
├── config/           # Environment configuration
├── native/           # NativeScript setup
├── routes/           # Route components (.gts files)
├── schemas/          # WarpDrive schema definitions
├── services/         # Ember services (including store)
├── ui/
│   ├── components/   # Reusable components
│   └── modifiers/    # Custom modifiers
├── app.js            # Application entry
├── boot.js           # Bootstrap logic
└── router.ts         # Route definitions
```

## Key Dependencies

### WarpDrive Packages
- `@warp-drive/core` - Core data management
- `@warp-drive/json-api` - JSON:API support
- `@warp-drive/core-types` - TypeScript types

### Ember Packages
- `ember-source` - Ember framework
- `@glimmer/component` - Component base class
- `ember-modifier` - Custom modifiers

### NativeScript Packages
- `@nativescript/core` - NativeScript core
- `@nativescript/theme` - UI theming
- `ember-native` - Ember + NativeScript integration

## Best Practices

1. **Always use schemas** - Define schemas for all data types
2. **Use signal hooks** - Required for reactivity
3. **Prefer Request API** - Use `store.request()` over legacy methods
4. **Type everything** - Leverage TypeScript for safety
5. **Test on device** - NativeScript behavior differs from web
6. **Check polyfills** - Verify Web API availability in NativeScript
7. **Follow Ember conventions** - Use Ember's file structure and naming

## Useful Commands

```bash
# Install dependencies
pnpm install

# Prepare Android platform
pnpm prepare-android

# Clean build
rm -rf platforms/android/build

# Check types
pnpm lint:types

# Debug type checking
pnpm debug:types
```

## Additional Resources

- [Ember Guides](https://guides.emberjs.com/)
- [NativeScript Docs](https://docs.nativescript.org/)
- [Glimmer Components](https://guides.emberjs.com/release/components/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
