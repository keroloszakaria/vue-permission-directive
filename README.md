# Vue Permission Directive

A flexible Vue.js directive for handling user permissions with multiple validation modes. This directive allows you to conditionally show/hide elements based on user permissions with support for various matching strategies.

## Features

- 🎯 **Multiple validation modes**: `and`, `or`, `exact`, `startWith`, `endWith`, `regex`
- 🔄 **Reactive permissions**: Works with Vue refs and reactive data
- 🛡️ **Type-safe**: Full TypeScript support
- 🎨 **Flexible API**: Support for strings, arrays, and complex objects
- 🔧 **Development warnings**: Helpful warnings in development mode
- 🚀 **Vue 3 compatible**: Built for Vue 3 with Composition API support

## Installation

```bash
npm install vue-permission-directive
```

## Quick Start

### 1. Install and configure the directive

```javascript
// main.js
import { createApp } from "vue";
import vPermission, {
  configurePermissionDirective,
} from "vue-permission-directive";
import App from "./App.vue";

const app = createApp(App);

// Configure with your permissions array
const userPermissions = ["read", "write", "admin.users"];
configurePermissionDirective(userPermissions, { developmentMode: true });

// Or configure development mode separately
import { setDevelopmentMode } from "vue-permission-directive";
setDevelopmentMode(import.meta.env.DEV); // For Vite
// or
setDevelopmentMode(process.env.NODE_ENV === "development"); // For other bundlers

// Or with a reactive ref
import { ref } from "vue";
const userPermissions = ref(["read", "write"]);
configurePermissionDirective(userPermissions, { developmentMode: true });

// Register the directive
app.directive("permission", vPermission);

app.mount("#app");
```

### 2. Use in templates

```vue
<template>
  <!-- Simple permission check -->
  <button v-permission="'read'">Read Data</button>

  <!-- Multiple permissions (OR mode by default) -->
  <div v-permission="['admin', 'moderator']">Admin Panel</div>

  <!-- AND mode - user must have ALL permissions -->
  <div v-permission="{ permissions: ['read', 'write'], mode: 'and' }">
    Edit Content
  </div>

  <!-- Always visible -->
  <div v-permission="'*'">Always shown</div>
</template>
```

## API Reference

### Configuration

#### `configurePermissionDirective(permissions, options?)`

Configure the directive with user permissions and options.

**Parameters:**

- `permissions`: `string[] | Ref<string[]>` - Array of user permissions or a Vue ref
- `options?`: `{ developmentMode?: boolean }` - Configuration options

**Example:**

```javascript
import {
  configurePermissionDirective,
  setDevelopmentMode,
} from "vue-permission-directive";

// With development mode enabled
configurePermissionDirective(["read", "write", "admin"], {
  developmentMode: true,
});

// Or set development mode separately
setDevelopmentMode(import.meta.env.DEV); // Vite
setDevelopmentMode(process.env.NODE_ENV === "development"); // Webpack/others

// Reactive ref
import { ref } from "vue";
const permissions = ref(["read", "write"]);
configurePermissionDirective(permissions, { developmentMode: true });
```

#### `setDevelopmentMode(enabled)`

Enable or disable development warnings.

**Parameters:**

- `enabled`: `boolean` - Whether to show development warnings

### Directive Usage

#### Simple String Permission

```vue
<div v-permission="'read'">Content</div>
```

#### Array of Permissions (OR mode)

```vue
<div v-permission="['read', 'write']">Content</div>
```

#### Object with Mode

```vue
<div
  v-permission="{ permissions: ['read', 'write'], mode: 'and' }"
>Content</div>
```

### Validation Modes

#### `or` (default)

User must have **any** of the specified permissions.

```vue
<div v-permission="{ permissions: ['read', 'write'], mode: 'or' }">
  Visible if user has 'read' OR 'write'
</div>
```

#### `and`

User must have **all** of the specified permissions.

```vue
<div v-permission="{ permissions: ['read', 'write'], mode: 'and' }">
  Visible if user has 'read' AND 'write'
</div>
```

#### `exact`

Exact string matching (same as default behavior).

```vue
<div
  v-permission="{ permissions: ['admin.users', 'admin.posts'], mode: 'exact' }"
>
  Visible if user has exactly 'admin.users' OR exactly 'admin.posts'
</div>
```

#### `startWith`

Check if user has any permission that starts with the specified strings.

```vue
<div
  v-permission="{ permissions: ['admin.', 'moderator.'], mode: 'startWith' }"
>
  Visible if user has any permission starting with 'admin.' OR 'moderator.'
</div>
```

#### `endWith`

Check if user has any permission that ends with the specified strings.

```vue
<div v-permission="{ permissions: ['.read', '.write'], mode: 'endWith' }">
  Visible if user has any permission ending with '.read' OR '.write'
</div>
```

#### `regex`

Use regular expressions for complex pattern matching.

```vue
<div
  v-permission="{
    permissions: ['^admin\\..*', 'user\\.(read|write)$'],
    mode: 'regex',
  }"
>
  Visible if user has permissions matching the regex patterns
</div>
```

### Advanced Usage

#### Mixed Arrays

Combine different permission types in a single array:

```vue
<div v-permission="['read', { permissions: ['write', 'delete'], mode: 'and' }]">
  Visible if user has 'read' OR (both 'write' AND 'delete')
</div>
```

#### Wildcard

Always show element regardless of permissions:

```vue
<div v-permission="'*'">Always visible</div>
```

## TypeScript Support

The package includes full TypeScript definitions:

```typescript
import { Ref } from "vue";
import vPermission, {
  configurePermissionDirective,
  PermissionValue,
} from "vue-permission-directive";

// Types are automatically inferred
const permissions: Ref<string[]> = ref(["read", "write"]);
configurePermissionDirective(permissions);

// Permission value types
const simplePermission: PermissionValue = "read";
const arrayPermission: PermissionValue = ["read", "write"];
const objectPermission: PermissionValue = {
  permissions: ["read", "write"],
  mode: "and",
};
```

## Examples

### With Pinia Store

```javascript
// stores/auth.js
import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    permissions: [],
  }),
  actions: {
    setUser(user) {
      this.user = user;
      this.permissions = user.permissions || [];
    },
  },
});

// main.js
import { useAuthStore } from "@/stores/auth";
import { configurePermissionDirective } from "vue-permission-directive";

const authStore = useAuthStore();
configurePermissionDirective(authStore.permissions, {
  developmentMode: import.meta.env.DEV,
});
```

### With Vuex

```javascript
// main.js
import store from "@/store";
import { configurePermissionDirective } from "vue-permission-directive";

// Assuming permissions are in store.state.auth.permissions
configurePermissionDirective(
  computed(() => store.state.auth.permissions),
  { developmentMode: process.env.NODE_ENV === "development" }
);
```

### Dynamic Permission Updates

```vue
<script setup>
import { ref } from "vue";
import {
  configurePermissionDirective,
  setDevelopmentMode,
} from "vue-permission-directive";

const userPermissions = ref(["read"]);

// Configure directive with reactive permissions
configurePermissionDirective(userPermissions, { developmentMode: true });

// Update permissions dynamically
const addWritePermission = () => {
  userPermissions.value.push("write");
};
</script>

<template>
  <div v-permission="'write'">
    This will appear after clicking the button below
  </div>

  <button @click="addWritePermission">Add Write Permission</button>
</template>
```

## Development

### Building

```bash
npm run build
```

### Development Mode

The directive provides helpful warnings in development mode when:

- Permissions are not configured
- Invalid permission formats are used
- Regex patterns are malformed
- Required object properties are missing

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
