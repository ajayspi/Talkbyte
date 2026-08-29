import { describe, it, expect } from '@jest/globals';

describe('Example Test Suite', () => {
  it('should pass a basic assertion', () => {
    const value = 2 + 2;
    expect(value).toBe(4);
  });

  it('should demonstrate string matching', () => {
    const text = 'Hello, World!';
    expect(text).toContain('World');
  });
});
