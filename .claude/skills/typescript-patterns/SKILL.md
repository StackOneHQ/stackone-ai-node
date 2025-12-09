---
name: typescript-patterns
description: Use when writing or reviewing TypeScript code. Covers type safety, exhaustiveness checks, avoiding any/non-null assertions, clean code practices. (project)
globs: "*.ts"
alwaysApply: false
---

# TypeScript Patterns and Best Practices

Guidelines for writing clean, type-safe TypeScript code in this repository.

## Exhaustiveness Checking with `satisfies never`

When branching on string unions, use the `satisfies never` pattern to guarantee compile-time exhaustiveness without introducing temporary variables.

**Pattern**:
```typescript
switch (bodyType) {
  case 'json':
    // ...
    break;
  case 'form':
    // ...
    break;
  case 'multipart-form':
    // ...
    break;
  default: {
    bodyType satisfies never; // Error if new variant added
    throw new Error(`Unsupported HTTP body type: ${String(bodyType)}`);
  }
}
```

**Benefits**:
- Adding a new union member will trigger a compile-time error
- Keeps union definition and switch statement in sync automatically
- No temporary variables needed
- Clear intent about exhaustiveness checking

## Avoiding `any` Type

Always use specific types instead of `any` when possible.

**Bad**:
```typescript
function processData(data: any): any {
  return data.value;
}
```

**Good**:
```typescript
function processData<T extends { value: U }, U>(data: T): U {
  return data.value;
}

// Or with type narrowing
function processData(data: unknown): unknown {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as Record<string, unknown>).value;
  }
  throw new Error('Invalid data format');
}
```

**Alternatives to `any`**:
- Use `unknown` when type is truly not known, then narrow with type guards
- Use `Record<string, unknown>` for objects with unknown property values
- Use union types to represent multiple possible types
- Use generics with type constraints

## Non-null Assertions (`!`) - Avoid

Never use non-null assertions. Instead, use proper null checking.

**Bad**:
```typescript
function getConfig(configMap: Map<string, Config>): Config {
  const config = configMap.get('default');
  return config!; // Dangerous!
}
```

**Good**:
```typescript
function getConfig(configMap: Map<string, Config>): Config {
  const config = configMap.get('default');
  if (!config) {
    throw new Error('Default config not found');
  }
  return config;
}

// Or with optional chaining and nullish coalescing
function getConfig(configMap: Map<string, Config>): Config {
  return configMap.get('default') ?? getDefaultConfig();
}
```

## Parameter Reassignment - Avoid

Create new variables instead of reassigning function parameters.

**Bad**:
```typescript
function mergeOptions(options: Options, overrides?: Options): Options {
  options = { ...options, ...overrides }; // Reassignment
  return options;
}
```

**Good**:
```typescript
function mergeOptions(options: Options, overrides?: Options): Options {
  const mergedOptions = { ...options, ...overrides };
  return mergedOptions;
}
```

## Classes with Only Static Members - Avoid

Use namespaces or simple exported functions instead.

**Bad**:
```typescript
export class Utils {
  public static formatDate(date: Date): string {
    return date.toISOString();
  }

  public static parseDate(dateStr: string): Date {
    return new Date(dateStr);
  }
}
```

**Good - Namespace**:
```typescript
export namespace Utils {
  export const formatDate = (date: Date): string => {
    return date.toISOString();
  };

  export const parseDate = (dateStr: string): Date => {
    return new Date(dateStr);
  };
}
```

**Better - Simple exports**:
```typescript
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const parseDate = (dateStr: string): Date => {
  return new Date(dateStr);
};
```

## Explicit Return Types

Always specify return types for functions.

**Bad**:
```typescript
const calculateTotal = (items: Item[]) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};
```

**Good**:
```typescript
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// Or for function declarations
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

## Property Deletion - Type-Safe Methods

Use proper type-safe methods to remove properties instead of setting to `undefined` or using `delete`.

**Bad**:
```typescript
function removeProperty(obj: Record<string, JSONSchema7Definition>): void {
  obj['propertyToRemove'] = undefined; // Type error!
  delete obj['propertyToRemove']; // Linter warning
}
```

**Good - Destructuring (Immutable)**:
```typescript
function removeProperty(obj: Record<string, JSONSchema7Definition>): Record<string, JSONSchema7Definition> {
  const { propertyToRemove, ...rest } = obj;
  return rest;
}
```

**Good - Delete (In-place)**:
```typescript
function removeProperty(obj: Record<string, JSONSchema7Definition>): void {
  delete obj['propertyToRemove'];
}
```

## Remove Unused Code

After refactoring, always remove unused code:
- Delete unused variables, parameters, functions, classes, imports
- Don't comment out old code - delete it (git history preserves it)
- Remove unreachable code paths

## Quick Reference

1. Use `satisfies never` for union type switches
2. Prefer `unknown` over `any` with type guards
3. Use `?.` and `??` instead of non-null assertions
4. Always specify return types
5. Use destructuring for property removal
6. Use simple exports instead of static-only classes
7. Don't reassign parameters - create new variables
8. Remove unused code after refactoring
