# Testing Guide for PAI Website

This project uses **Vitest** as the testing framework with **React Testing Library** for component testing.

## Setup

Testing dependencies are already configured in `package.json`:
- `vitest` - Fast unit test framework
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom matchers for DOM assertions
- `@vitest/ui` - Visual UI for test results
- `@vitest/coverage-v8` - Code coverage reporting
- `jsdom` - DOM implementation for Node.js

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (default)
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

Coverage reports are generated in the following formats:
- **Text**: Console output
- **HTML**: `coverage/index.html` (open in browser)
- **JSON**: `coverage/coverage-final.json`
- **LCOV**: `coverage/lcov.info` (for CI/CD integration)

## Writing Tests

### Example: Testing Utility Functions

See `app/lib/utils.test.ts` for a complete example.

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './utils';

describe('Utils - formatCurrency', () => {
  it('should format amount in Indian Rupees', () => {
    expect(formatCurrency(1000)).toBe('₹1,000');
  });
});
```

### Test Structure

1. **Describe Block**: Group related tests
2. **It Block**: Individual test case
3. **Expect**: Assertion

### Common Matchers

```typescript
// Equality
expect(value).toBe(expected);
expect(value).toEqual(expected);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(5);

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objects
expect(object).toHaveProperty('key');
```

## Testing Best Practices

1. **Test One Thing**: Each test should verify one specific behavior
2. **Descriptive Names**: Use clear test descriptions
3. **AAA Pattern**: Arrange, Act, Assert
4. **Mock External Dependencies**: Database, API calls, etc.
5. **Test Edge Cases**: Empty inputs, null values, errors

## Example Test Cases

### Testing Validation Functions
```typescript
describe('isValidEmail', () => {
  it('should validate correct email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(isValidEmail('invalid')).toBe(false);
  });
});
```

### Testing React Components (Future)
```typescript
import { render, screen } from '@testing-library/react';

describe('LoginButton', () => {
  it('should render login button', () => {
    render(<LoginButton />);
    expect(screen.getByText('Login')).toBeInTheDocument();
  });
});
```

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Next Steps

1. Add tests for all utility functions
2. Add tests for authentication logic
3. Add tests for form validation
4. Add component tests for UI elements
5. Add integration tests for critical flows

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```
