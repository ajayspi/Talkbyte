import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Clean legacy conflicting route stubs before Turbopack constructs route graph
const legacyStubs = [
  path.join(__dirname, 'src', 'app', 'login'),
  path.join(__dirname, 'src', 'app', '(admin)', 'admin', 'login'),
  path.join(process.cwd(), 'src', 'app', 'login'),
  path.join(process.cwd(), 'src', 'app', '(admin)', 'admin', 'login'),
];

for (const stub of legacyStubs) {
  try {
    if (fs.existsSync(stub)) {
      fs.rmSync(stub, { recursive: true, force: true });
      console.log(`[next.config.mjs] Safely removed legacy route stub: ${stub}`);
    }
  } catch (err) {
    console.warn(`[next.config.mjs] Failed to remove ${stub}:`, err);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
