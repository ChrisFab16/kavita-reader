#!/usr/bin/env node
/**
 * T001 optional live probe — POST on-deck and want-to-read/v2.
 * Usage: KAVITA_URL=... KAVITA_USER=... KAVITA_PASS=... node scripts/probe-kavita-personal-lists.mjs
 */
const baseUrl = (process.env.KAVITA_URL || '').replace(/\/$/, '');
const username = process.env.KAVITA_USER || '';
const password = process.env.KAVITA_PASS || '';

if (!baseUrl || !username || !password) {
  console.log('Skip: set KAVITA_URL, KAVITA_USER, KAVITA_PASS for live probe');
  process.exit(0);
}

async function main() {
  const loginRes = await fetch(`${baseUrl}/api/account/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!loginRes.ok) {
    console.error('Login failed', loginRes.status, await loginRes.text());
    process.exit(1);
  }
  const { token } = await loginRes.json();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const onDeck = await fetch(`${baseUrl}/api/Series/on-deck?PageNumber=1&PageSize=5`, {
    method: 'POST',
    headers,
    body: '{}',
  });
  console.log('on-deck', onDeck.status, onDeck.headers.get('Pagination')?.slice(0, 80) ?? '');

  const wtr = await fetch(`${baseUrl}/api/want-to-read/v2?PageNumber=1&PageSize=5`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ statements: [], combination: 1 }),
  });
  console.log('want-to-read/v2', wtr.status, wtr.headers.get('Pagination')?.slice(0, 80) ?? '');

  const check = await fetch(`${baseUrl}/api/want-to-read?seriesId=1`, { headers });
  console.log('want-to-read check', check.status, await check.text());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
