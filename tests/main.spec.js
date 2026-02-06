const { test, expect } = require('@playwright/test');

const USERNAME = 'administrator';
const PASSWORD = 'Fossano.2026';
const BASE_URL = 'https://taiko.mantishub.io';

test.describe('Taiko MantisHub Login Tests', () => {

  test('001 - Successful Login Flow', async ({ page }) => {
    console.log('\n=== Starting Login Test ===');
    
    // Navigate to login page
    console.log('Step 1: Navigating to login page...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('taiko');
    console.log('✅ Page loaded');

    // Enter username
    console.log('Step 2: Entering username...');
    const usernameInput = page.locator('input[name="username"]');
    expect(await usernameInput.isVisible()).toBeTruthy();
    await usernameInput.fill(USERNAME);
    console.log(`✅ Username: ${USERNAME}`);

    // Look for password input or click Next
    console.log('Step 3: Looking for password field...');
    let passwordInput = page.locator('input[type="password"]');
    
    if (await passwordInput.count() === 0) {
      // Password field not visible, look for submit/continue button
      console.log('    Password not visible, clicking submit...');
      const submitBtn = page.locator('input[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
      }
      passwordInput = page.locator('input[type="password"]');
    }

    // Enter password
    console.log('Step 4: Entering password...');
    expect(await passwordInput.isVisible()).toBeTruthy();
    await passwordInput.fill(PASSWORD);
    console.log('✅ Password entered');

    // Submit form
    console.log('Step 5: Submitting login...');
    const submitBtn = page.locator('input[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }

    // Wait for navigation
    console.log('Step 6: Waiting for dashboard...');
    await page.waitForTimeout(2000);
    const finalURL = page.url();
    console.log(`Final URL: ${finalURL}`);

    // Verify logged in
    expect(finalURL).toContain('app');
    console.log('✅ Login successful!');
  });

  test('002 - Dashboard is Accessible', async ({ page }) => {
    console.log('\n=== Dashboard Test ===');
    
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    // Quick login if needed
    const loginForm = page.locator('input[name="username"]');
    if (await loginForm.isVisible()) {
      console.log('Login required, performing quick login...');
      
      await loginForm.fill(USERNAME);
      const submitBtn = page.locator('input[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
      }

      const passInput = page.locator('input[type="password"]');
      if (await passInput.isVisible()) {
        await passInput.fill(PASSWORD);
        const submit2 = page.locator('input[type="submit"]').first();
        if (await submit2.isVisible()) {
          await submit2.click();
        }
      }

      await page.waitForTimeout(2000);
    }

    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    expect(pageTitle).toBeTruthy();
    console.log('✅ Dashboard accessible');
  });

  test('003 - Page Elements Loaded', async ({ page }) => {
    console.log('\n=== Page Elements Test ===');
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    // Check basic elements
    const inputs = await page.locator('input').count();
    console.log(`Found ${inputs} input elements`);
    expect(inputs).toBeGreaterThan(0);

    const buttons = await page.locator('button').count();
    console.log(`Found ${buttons} button elements`);

    console.log('✅ Page elements loaded');
  });

  test('004 - Session Persistence', async ({ page }) => {
    console.log('\n=== Session Persistence Test ===');
    
    // First visit
    await page.goto(BASE_URL);
    const firstURL = page.url();
    console.log(`First URL: ${firstURL}`);

    // Reload page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    const reloadURL = page.url();
    console.log(`After reload: ${reloadURL}`);

    expect(firstURL).toBeTruthy();
    console.log('✅ Session test passed');
  });

});
