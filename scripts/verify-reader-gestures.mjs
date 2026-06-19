#!/usr/bin/env node
/**
 * Automated reader gesture contract check (no device/emulator required).
 * Run: npm run test:gestures
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const result = spawnSync(
  process.execPath,
  [
    join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    '--test',
    'src/utils/readerGestures.test.ts',
    'src/utils/readerFit.test.ts',
  ],
  { cwd: root, stdio: 'inherit' }
);

if (result.status !== 0) {
  console.error('\n❌ Reader gesture contract failed — fix readerGestures / readerFit before manual QA.\n');
  process.exit(result.status ?? 1);
}

console.log('\n✅ Reader gesture contract passed (tap zones, pinch math, double-tap timing).\n');
