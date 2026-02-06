const { chromium } = require('playwright');

const SITE = 'https://minerifyrandomuser.netlify.app/';

function safeJson(obj) {
  try { return JSON.stringify(obj); } catch { return String(obj); }
}

async function tryClick(page, selectors) {
  for (const s of selectors) {
    try {
      const locator = page.locator(s);
      if (await locator.count() === 0) continue;
      await locator.first().scrollIntoViewIfNeeded();
      await locator.first().click({ timeout: 3000 });
      return true;
    } catch (e) { 
      // ignore and try next
    }
  }
  return false;
}

// add basic logging to see progress when running
(async () => {
  console.log('Starting test runner...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  let lastApiResponse = null;
  page.on('response', async resp => {
    try {
      const url = resp.url();
      if (url.includes('randomuser.me/api')) {
        const status = resp.status();
        if (status === 200) {
          const json = await resp.json();
          lastApiResponse = { url, json, ts: Date.now() };
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  });

  const results = [];

  // Navigate to site and wait for initial API call
  try {
    console.log('Navigating to', SITE);
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 20000 });
    // wait for at least one API response (results) using synchronous predicate
    await page.waitForResponse(r => r.url().includes('randomuser.me/api') && r.status() === 200, { timeout: 10000 });
    console.log('Initial API response received');
  } catch (e) {
    console.warn('Navigation or initial API wait failed:', e.message);
    // we'll still continue and report failures per test
  }

  // TC-001: page loads and has main header + button
  try {
    const headerSelectorCandidates = ['h1', 'header', 'text=Minerify', 'text=Random User'];
    let headerPresent = false;
    for (const s of headerSelectorCandidates) {
      try {
        const loc = page.locator(s);
        if (await loc.count() > 0) {
          const text = (await loc.first().innerText()).trim();
          if (text.length > 0) { headerPresent = true; break; }
        }
      } catch (e) {}
    }

    const buttonPresent = await (async () => {
      const btn = page.locator('button:has-text("Get New")');
      if (await btn.count() > 0) return true;
      const alt = page.locator('text=Get New User');
      return (await alt.count()) > 0;
    })();

    results.push({ id: 'TC-001', ok: headerPresent && buttonPresent, details: { headerPresent, buttonPresent } });
  } catch (e) {
    results.push({ id: 'TC-001', ok: false, details: { error: e.message } });
  }

  // TC-002: first user data visible (check last API response fields)
  try {
    console.log('Running TC-002');
    let ok = false;
    let details = {};
    if (lastApiResponse && lastApiResponse.json && Array.isArray(lastApiResponse.json.results) && lastApiResponse.json.results.length > 0) {
      const u = lastApiResponse.json.results[0];
      const hasPicture = u.picture && (u.picture.large || u.picture.medium || u.picture.thumbnail);
      const hasName = u.name && u.name.first && u.name.last;
      const hasEmail = u.email;
      const hasPhone = u.phone || u.cell;
      const hasNat = u.nat;
      const hasDob = u.dob && u.dob.date;
      ok = !!(hasPicture && hasName && hasEmail && hasPhone && hasNat && hasDob);
      details = { email: u.email || null, name: u.name ? `${u.name.first} ${u.name.last}` : null, hasPicture: !!hasPicture, hasPhone: !!hasPhone, nat: u.nat || null };
    } else {
      // fallback: check DOM for email and image
      const pageContent = await page.content();
      const emailMatch = pageContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const img = await page.$('img');
      ok = !!(emailMatch && img);
      details = { email: emailMatch ? emailMatch[0] : null, hasImage: !!img };
    }
    results.push({ id: 'TC-002', ok, details });
  } catch (e) {
    results.push({ id: 'TC-002', ok: false, details: { error: e.message } });
  }

  // TC-003: Get New User loads a different user (use API response comparison)
  try {
    console.log('Running TC-003');
    const prevEmail = (lastApiResponse && lastApiResponse.json && lastApiResponse.json.results && lastApiResponse.json.results[0]) ? lastApiResponse.json.results[0].email : null;
    const prevTs = lastApiResponse ? lastApiResponse.ts : 0;
    // click the button
    const clicked = await tryClick(page, ['button:has-text("Get New")', 'text=Get New User', 'button']);
    if (!clicked) throw new Error('Could not click Get New User button');

    // poll for a new API response captured by page.on('response')
    let found = false;
    let newEmail = null;
    const maxMs = 8000;
    const interval = 200;
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      if (lastApiResponse && lastApiResponse.ts && lastApiResponse.ts > prevTs) {
        try {
          const jr = lastApiResponse.json;
          if (jr && jr.results && jr.results[0] && jr.results[0].email) {
            newEmail = jr.results[0].email;
            found = true;
            break;
          }
        } catch (e) {}
      }
      await page.waitForTimeout(interval);
    }
    const changed = prevEmail && newEmail && prevEmail !== newEmail;
    results.push({ id: 'TC-003', ok: found && changed, details: { before: prevEmail || null, after: newEmail || null, found } });
  } catch (e) {
    results.push({ id: 'TC-003', ok: false, details: { error: e.message } });
  }

  // TC-004: Filter Male - select male and ensure API returns male results
  try {
    console.log('Running TC-004');
    // try to click radio or label for male
    let clicked = await tryClick(page, ['text=Male', 'text=Maschio', 'input[type="radio"][value="male"]']);
    if (!clicked) {
      // try to click a label that contains "Male"
      clicked = await tryClick(page, ['label:has-text("Male")', 'label:has-text("Maschio")']);
    }
    if (!clicked) console.warn('Could not locate Male selector; continuing heuristically');
    // after selecting, trigger a fetch by clicking Get New User
    await tryClick(page, ['button:has-text("Get New")', 'text=Get New User']);

    // wait for new API response via polling
    const prevTs2 = lastApiResponse ? lastApiResponse.ts : 0;
    let found2 = false;
    let jr = null;
    const maxMs2 = 8000;
    const interval2 = 200;
    const start2 = Date.now();
    while (Date.now() - start2 < maxMs2) {
      if (lastApiResponse && lastApiResponse.ts && lastApiResponse.ts > prevTs2) {
        jr = lastApiResponse.json;
        found2 = true;
        break;
      }
      await page.waitForTimeout(interval2);
    }
    if (!found2) throw new Error('No API response captured after selecting Male');
    const allMale = Array.isArray(jr.results) && jr.results.every(u => (u.gender || '').toLowerCase() === 'male');
    results.push({ id: 'TC-004', ok: allMale, details: { sampleCount: jr.results.length, allMale } });
  } catch (e) {
    results.push({ id: 'TC-004', ok: false, details: { error: e.message } });
  }

  // Print results
  console.log('\nTest summary:');
  let failed = 0;
  for (const r of results) {
    const status = r.ok ? 'PASS' : 'FAIL';
    if (!r.ok) failed++;
    console.log(`${r.id}: ${status} - ${safeJson(r.details)}`);
  }

  await browser.close();

  if (failed > 0) {
    console.log(`\n${failed} test(s) failed.`);
    process.exit(2);
  } else {
    console.log('\nAll tests passed (or heuristics succeeded).');
    process.exit(0);
  }

})().catch(e => {
  console.error('Fatal error running tests:', e);
  process.exit(3);
});
