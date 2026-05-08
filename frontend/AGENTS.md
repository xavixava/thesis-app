# AI Agent Guidelines for Key Rollover Frontend

## Project Overview

This is a Vue.js + Tailwind CSS frontend application for a key rollover system. The backend already exists. Your role is to help build a secure, maintainable frontend that communicates with the existing API.

## Tech Stack

- **Framework:** Vue.js 3 (Composition API)
- **Styling:** Tailwind CSS
- **Build Tool:** Vite
- **State Management:** Pinia (if needed)
- **HTTP Client:** native fetch
- **Testing:** Vitest + Vue Test Utils
- **Linting:** ESLint + @vue/eslint-config-typescript
- **Type Checking:** TypeScript

## Development Commands

### Setup & Installation
```bash
# Install dependencies (USER RUNS THIS COMMAND)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing Commands
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npm run test path/to/test.spec.ts

# Run tests with coverage
npm run test:coverage
```

### Code Quality Commands
```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check

# Run all quality checks (lint + type-check + test)
npm run check
```

## Package Installation Policy

**You are NEVER permitted to run install commands directly.**

When a new dependency is needed:
1. Explain why the package is necessary
2. Provide the exact install command for the user to run:
   ```
   npm install package-name
   ```
3. Wait for user confirmation that they have run the command
4. Only then proceed with code that uses the package

**ALWAYS** provide commands as formatted code blocks for the user to execute themselves.

## Code Style & Conventions

### Import Organization
```typescript
// 1. Vue imports
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 2. Third-party libraries
import axios from 'axios'
import { z } from 'zod'

// 3. Internal imports (use alphabetical order)
import type { User } from '@/types/user'
import { useAuthStore } from '@/stores/auth'
import { MyComponent } from '@/components/MyComponent.vue'
```

### Component Structure
```vue
<template>
  <!-- Semantic HTML with proper ARIA labels -->
  <main class="container" role="main">
    <header>
      <h1>{{ title }}</h1>
    </header>
    
    <!-- Loading and error states -->
    <div v-if="loading" class="loading" aria-live="polite">
      Loading...
    </div>
    
    <div v-else-if="error" class="error" role="alert">
      {{ error }}
    </div>
    
    <!-- Main content -->
    <section v-else>
      <!-- Component content -->
    </section>
  </main>
</template>

<script setup lang="ts">
// 1. Imports
// 2. Props & Emits definitions
// 3. Type definitions
// 4. Reactive state
// 5. Computed properties
// 6. Methods
// 7. Lifecycle hooks
</script>

<style scoped>
/* Use Tailwind classes for styling */
/* Only use custom CSS for complex animations or utilities */
</style>
```

### Naming Conventions
- **Components:** PascalCase (UserProfile.vue)
- **Files:** kebab-case for utilities (user-service.ts)
- **Variables:** camelCase (userName, isAuthenticated)
- **Constants:** SCREAMING_SNAKE_CASE (API_BASE_URL)
- **Functions:** camelCase with descriptive verbs (fetchUserData, validateForm)
- **Types/Interfaces:** PascalCase with descriptive suffixes (UserData, ApiResponse)

### TypeScript Guidelines
```typescript
// Always prefer explicit typing
interface User {
  id: string
  email: string
  role: UserRole
}

// Use union types for status
type Status = 'loading' | 'success' | 'error'

// Use generics for reusable functions
function apiCall<T>(url: string): Promise<T> {
  return fetch(url).then(res => res.json())
}

// Prefer interface for objects, type for unions/primitives
```

### Error Handling
```typescript
// Always handle errors in API calls
try {
  const response = await fetch('/api/users')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  
  const data = await response.json()
  // Validate data before using
  const validatedData = userSchema.parse(data)
  users.value = validatedData
} catch (error) {
  console.error('Failed to fetch users:', error) // Only in development
  errorMessage.value = 'Failed to load users. Please try again.'
} finally {
  loading.value = false
}

// Use composables for error handling
const { error, execute } = useAsyncOperation(fetchUsers)
```

### Vue.js Best Practices
- Use Composition API with `<script setup>`
- Prefer `ref` over `reactive` for primitive values
- Use `computed` for derived state
- Avoid mutating props directly
- Use `provide/inject` sparingly, prefer props/events
- Implement proper loading and error states
- Use `v-show` for frequent toggling, `v-if` for conditional rendering

### Tailwind CSS Guidelines
- Use utility classes for 90% of styling
- Create component classes in `@apply` for repeated patterns
- Use CSS variables for theme colors
- Maintain responsive design: `sm: md: lg: xl:`
- Use semantic color tokens: `text-primary`, `bg-secondary`
- Avoid magic numbers, use spacing scale

### State Management (Pinia)
```typescript
// Store structure
export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const loading = ref(false)
  
  // Getters
  const isAuthenticated = computed(() => !!user.value)
  
  // Actions
  async function login(credentials: LoginCredentials) {
    loading.value = true
    try {
      // Login logic
    } finally {
      loading.value = false
    }
  }
  
  return {
    user: readonly(user),
    loading: readonly(loading),
    isAuthenticated,
    login
  }
})
```

## Security & Best Practices

- **Never log tokens or secrets** to the console, even in development
- **Never commit API keys** - use environment variables
- **Validate all inputs** with Zod schemas
- **Validate all API responses** before using data
- **Implement proper error handling** - never expose raw errors to users
- **Use HTTPS only** in production
- **Set proper CORS headers** on backend
- **Implement session timeout** with proper cleanup
- **Disable Vue devtools** in production builds
- **Use Content Security Policy** headers

### Environment Variables
```typescript
// Use Vite's env system
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const APP_ENV = import.meta.env.MODE

// Never expose secrets to frontend
// Only public keys and non-sensitive config
```

## Accessibility Requirements

- Use semantic HTML5 elements (`<main>`, `<nav>`, `<section>`)
- Include proper ARIA labels and roles
- Ensure keyboard navigation works for all interactive elements
- Maintain WCAG AA color contrast (4.5:1 for normal text)
- Provide loading states with `aria-live="polite"`
- Use proper heading hierarchy (h1 → h2 → h3)
- Add `alt` text to all meaningful images
- Test with screen readers

## Testing Guidelines

### Component Testing
```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UserProfile from '@/components/UserProfile.vue'

describe('UserProfile', () => {
  it('renders user name correctly', () => {
    const user = { id: '1', name: 'John Doe' }
    const wrapper = mount(UserProfile, { props: { user } })
    
    expect(wrapper.text()).toContain('John Doe')
  })
  
  it('emits update event when form is submitted', async () => {
    const wrapper = mount(UserProfile)
    await wrapper.find('form').trigger('submit')
    
    expect(wrapper.emitted('update')).toBeTruthy()
  })
})
```

### Testing Considerations
When writing components, consider testability:

- Keep business logic in composables (easier to unit test)
- Use dependency injection for services
- Avoid direct DOM manipulation
- Test business logic separately from Vue components
- Mock external dependencies (API calls, router)
- Test error scenarios and edge cases

## Communication with User

- Explain your reasoning for architectural decisions
- Offer alternatives when multiple approaches exist
- Flag potential security concerns immediately
- Ask for clarification on business logic, not implementation details
- Provide complete, working code — avoid placeholders like // TODO unless explicitly discussing future work

## What NOT to Do

- **Run install commands directly** - always provide commands for user to execute
- Store secrets or tokens insecurely
- Use `v-html` with dynamic content (XSS risk)
- Ignore error handling or expose raw errors to users
- Write code that only works in development
- Make assumptions about the backend API without asking
- Use deprecated Vue 2 patterns (Composition API preferred)
- Inline sensitive configuration - use environment variables
- Skip accessibility testing
- Commit `.env` files or API keys
- Use `any` type in TypeScript
- Create deeply nested component structures

## Quality Checklist

Before submitting code:
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] ESLint passes without warnings
- [ ] Accessibility requirements met
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Security considerations reviewed
- [ ] Responsive design tested
- [ ] Code follows naming conventions
- [ ] Documentation updated if needed

