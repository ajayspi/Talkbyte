const fs = require('fs');
const path = require('path');

// Clean legacy conflicting route stubs if present
['src/app/login', 'src/app/(admin)/admin/login'].forEach((dir) => {
  try {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  } catch {}
});

require('@testing-library/jest-dom');

process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:8000';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';

// Mock ResizeObserver for jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
