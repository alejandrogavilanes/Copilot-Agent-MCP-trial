# links-urls-agent-mcp-demo

An application for sharing list of links with a URL

# Technology used...

- Astro
- Preact
- Nanostores
- Tailwind CSS
- Postgres

### Vite / React / Tailwind / Nanostores / Astro Best Practices

This guide outlines **best practices** for building a **Vite / React / TailWind / Nanostores / Astro** application. The goal is **readability and maintainability**, minimizing abstraction to keep the codebase clear.

---

## Project Structure

```
/src
    /components        # Reusable UI components
    /layouts           # Page and shared layouts
    /pages             # Route pages and endpoints
    /stores            # Nanostore state management
    /styles            # Global styles and Tailwind
    /lib               # Shared utilities and helpers
    /types             # TypeScript definitions
    /assets            # Static assets and images
    /db                # Database schemas and queries
```

## Component Organization

```
/src/components
    /ui                # Basic UI elements (Button, Input, Card)
    /forms             # Form-related components
    /layout            # Layout-specific components
    /shared            # Shared features across pages
    index.ts           # Component exports
```

## Naming Conventions

- Use PascalCase for component files: `Button.tsx`, `CardList.tsx`
- Use kebab-case for utility files: `use-auth.ts`, `db-utils.ts`
- Use index.ts files for clean exports
- Suffix types with `.types.ts`
- Suffix stores with `.store.ts`

## File Organization Rules

1. Group related files together
2. Keep component files close to their styles
3. Co-locate tests with implementation
4. Use barrel exports (index.ts) for clean imports

## Example Component Structure

```typescript
// filepath: d:\source\repos\Copilot Agent MCP trial\src\components\ui\Button\index.tsx
/Button
    ├── Button.tsx        # Main component
    ├── Button.test.tsx   # Component tests
    ├── Button.types.ts   # Type definitions
    └── index.ts          # Export file
```

## Store Organization

```typescript
// filepath: d:\source\repos\Copilot Agent MCP trial\src\stores\links.store.ts
/stores
    ├── links.store.ts    # Link management
    ├── auth.store.ts     # Authentication state
    ├── ui.store.ts       # UI state
    └── index.ts          # Combined exports
```

## Page Structure

```
/src/pages
    ├── index.astro       # Home page
    ├── lists/            # List-related pages
    ├── auth/             # Authentication pages
    └── api/              # API endpoints
```

## Assets Organization

```
/src/assets
    ├── images/           # Image files
    ├── icons/            # Icon assets
    └── fonts/            # Font files
```

## Important Guidelines

1. **Flat Structure**: Avoid nesting more than 3 levels deep
2. **Predictable Paths**: Use consistent naming and organization
3. **Module Boundaries**: Keep related code together
4. **Clean Imports**: Use path aliases for better maintainability
   ```typescript
   // Good
   import { Button } from '@/components/ui'
   // Avoid
   import { Button } from '../../../../components/ui/Button'
   ```
5. **Type Organization**: Keep shared types in `/types` directory
6. **No generic 'helpers' folder.**

## React Component Best Practices

### Component Structure
- Use functional components with hooks
- One component per file
- Keep components focused and small (<200 lines)
- Use TypeScript for better type safety

### Naming & Organization
```
/UserProfile
    ├── UserProfile.tsx
    ├── UserProfile.test.tsx
    ├── UserProfile.types.ts
    └── index.ts
```

### Props & Types
- Use TypeScript interfaces for props:
  ```typescript
  interface ButtonProps {
    variant: 'primary' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
    onClick: () => void;
    children: React.ReactNode;
  }
  ```
- Make props explicit and required by default
- Use optional props sparingly with `?` modifier
- Prefer union types over boolean flags:
  ```typescript
  // Good
  variant: 'success' | 'error' | 'warning'
  // Avoid
  isSuccess: boolean;
  isError: boolean;
  ```
- Use proper React types:
  - React.ReactNode for children
  - React.ChangeEvent<HTMLInputElement> for input events
  - React.MouseEvent<HTMLButtonElement> for click events
- Export component types from separate `.types.ts` files
- Use generic types for reusable components
- Document complex prop types with JSDoc comments

### State Management
- Use hooks appropriately:
  - useState for simple state
  - useReducer for complex state
  - useContext for shared state
  - Keep state close to where it's used

### Performance Tips
- Memoize expensive calculations with useMemo
- Optimize callbacks with useCallback
- Use React.memo() sparingly
- Avoid premature optimization

### Side Effects
- Use useEffect for side effects management:
  ```typescript
  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getData();
        setState(data);
      } catch (error) {
        setError(error);
      }
    };
    fetchData();
  }, []);
  ```
- Follow cleanup pattern:
  - Cancel pending requests
  - Clear intervals/timeouts
  - Remove event listeners
- Proper dependency array management:
  - Include all dependencies
  - Use eslint-plugin-react-hooks
  - Avoid empty dependency arrays
- Common side effects patterns:
  - Data fetching
  - Subscriptions
  - DOM mutations
  - Event listeners
- Keep side effects isolated and focused
- Use custom hooks to reuse effect logic

### Error Handling
- Use error boundaries for UI errors
- Handle async errors in try/catch blocks
- Show meaningful error states

## Tailwind CSS Best Practices

### Class Organization
- Follow consistent ordering:
  ```html
  <div class="
    /* Layout (flex, grid, position) */
    flex items-center justify-between
    /* Spacing & Sizing */
    w-full max-w-md p-4 my-2
    /* Visual (colors, borders) */
    bg-white rounded-lg shadow-md
    /* Interactive & States */
    hover:bg-gray-50 focus:ring-2
  ">
  ```

### Component Patterns
- Use @apply for repeated utility patterns:
  ```css
  @layer components {
    .btn-primary {
      @apply px-4 py-2 bg-blue-600 text-white rounded-md
        hover:bg-blue-700 focus:ring-2 focus:ring-blue-500;
    }
  }
  ```
- Create design system tokens:
  ```css
  @layer base {
    :root {
      --color-primary: 59 130 246;
      --spacing-page: 1.5rem;
    }
  }
  ```

### Best Practices
- Use custom theme configuration
- Maintain consistent spacing scale
- Leverage CSS variables for theming
- Use semantic color naming
- Create component-specific variants
- Optimize for production with PurgeCSS

## PostgreSQL Best Practices

### Schema Design
- Use plural table names: `users`, `posts`
- Include timestamp columns:
  ```sql
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  ```
- Enforce referential integrity with foreign keys
- Use appropriate data types
- Add proper indexes

### Query Optimization
- Write performant queries:
  ```sql
  -- Good
  SELECT u.name, p.title
  FROM users u
  JOIN posts p ON u.id = p.user_id
  WHERE u.active = true
  LIMIT 10;

  -- Avoid
  SELECT *
  FROM users u, posts p
  WHERE u.id = p.user_id;
  ```
- Use prepared statements
- Implement pagination
- Add appropriate indexes
- Regular VACUUM and maintenance

### Security
- Use parameterized queries
- Implement row-level security
- Regular backup strategy
- Keep sensitive data encrypted
- Use strong password policies

### Database Management
- Use migrations for schema changes
- Implement connection pooling
- Monitor query performance
- Regular backups and testing
- Document database schema