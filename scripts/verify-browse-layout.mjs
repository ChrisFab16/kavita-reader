#!/usr/bin/env node
/**
 * Automated browse grid layout contract (spec 013 FR-009).
 * Run: npm run test:layout
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
    'src/utils/responsiveLayoutContract.test.ts',
    'src/utils/responsiveLayout.test.ts',
  ],
  { cwd: root, stdio: 'inherit' }
);

if (result.status !== 0) {
  console.error(
    '\n❌ Browse layout contract failed — fix responsiveLayout before shipping landscape grid changes.\n'
  );
  process.exit(result.status ?? 1);
}

console.log('\n✅ Browse layout contract passed (FR-009 column counts + row fit).\n');
