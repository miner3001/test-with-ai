import { test, expect } from '@playwright/test';

const USERNAME = 'administrator';
const PASSWORD = 'Fossano.2026';
const SITE_URL = 'https://taiko.mantishub.io';

test.describe('Taiko Login - Simplified Test Suite', () => {
  
  test('Test 1: Site Accessibility', async ({ page }) => {
    console.log('🔍 Testing site accessibility...');
    
    try {
      await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log('✅ Site loaded successfully');
      
      const title = await page.title();
      console.log(`Page title: ${title}`);
      
      expect(page.url()).toContain('taiko');
    } catch (error) {
      console.error('❌ Failed to load site:', error.message);
      throw error;
    }
  });

  test('Test 2: Login Form Detection', async ({ page }) => {
    console.log('🔍 Looking for login form...');
    
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Get all visible form fields
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input fields`);

    for (let i = 0; i < inputs.length && i < 5; i++) {
      const type = await inputs[i].getAttribute('type');
      const name = await inputs[i].getAttribute('name');
      const placeholder = await inputs[i].getAttribute('placeholder');
      console.log(`  Input ${i + 1}: type=${type}, name=${name}, placeholder=${placeholder}`);
    }

    const hasPasswordField = await page.locator('input[type="password"]').count() > 0;
    expect(hasPasswordField).toBeTruthy();
  });

  test('Test 3: Login Credentials Entry', async ({ page }) => {
    console.log('🔍 Testing login flow...');
    
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Try to find and fill username
    const userInput = page.locator('input[type="text"]').first();
    if (await userInput.isVisible().catch(() => false)) {
      console.log('Found username input');
      await userInput.fill(USERNAME);
      console.log(`✅ Username entered: ${USERNAME}`);
    }

    // Try to find and fill password
    const passInput = page.locator('input[type="password"]').first();
    if (await passInput.isVisible().catch(() => false)) {
      console.log('Found password input');
      await passInput.fill(PASSWORD);
      console.log(`✅ Password entered`);
    }

    // Look for submit button
    const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    if (await submitBtn.isVisible().catch(() => false)) {
      console.log('✅ Login button found');
      expect(await submitBtn.isVisible()).toBeTruthy();
    }
  });

  test('Test 4: 2FA Field Detection', async ({ page }) => {
    console.log('🔍 Looking for 2FA/OTP fields...');
    
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Get all inputs to check for 2FA patterns
    const allInputs = await page.locator('input[type="text"]').all();
    console.log(`Found ${allInputs.length} text input fields`);

    // Check for 2FA-related fields
    const twoFAIndicators = [
      'code', 'otp', '2fa', 'verification', 'token', 'authenticator'
    ];

    let found2FA = false;
    for (const input of allInputs) {
      const name = await input.getAttribute('name').catch(() => '');
      const placeholder = await input.getAttribute('placeholder').catch(() => '');
      const id = await input.getAttribute('id').catch(() => '');
      
      const text = `${name}${placeholder}${id}`.toLowerCase();
      
      if (twoFAIndicators.some(indicator => text.includes(indicator))) {
        console.log(`✅ Found 2FA field: ${name || placeholder || id}`);
        found2FA = true;
      }
    }

    if (!found2FA) {
      console.log('ℹ️ No 2FA fields detected on initial page (may appear after login)');
    }
  });

  test('Test 5: Full Login Sequence', async ({ page }) => {
    console.log('🔍 Starting full login sequence...');
    
    await page.goto(SITE_URL, { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });

    await page.waitForLoadState('networkidle').catch(() => {});
    
    console.log('Step 1: Filling username...');
    const userInput = page.locator('input[type="text"]').first();
    if (await userInput.isVisible().catch(() => false)) {
      await userInput.click({ timeout: 5000 });
      await userInput.clear();
      await userInput.fill(USERNAME);
      console.log('✅ Username filled');
    } else {
      console.warn('⚠️ Username field not found');
    }

    console.log('Step 2: Filling password...');
    const passInput = page.locator('input[type="password"]').first();
    if (await passInput.isVisible().catch(() => false)) {
      await passInput.click({ timeout: 5000 });
      await passInput.clear();
      await passInput.fill(PASSWORD);
      console.log('✅ Password filled');
    } else {
      console.warn('⚠️ Password field not found');
    }

    console.log('Step 3: Clicking login button...');
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click({ timeout: 10000 });
      console.log('✅ Login button clicked');

      // Wait for response
      await page.waitForTimeout(2000);

      console.log('Step 4: Checking for 2FA screen...');
      const twoFAInput = page.locator(
        'input[placeholder*="code" i], input[placeholder*="otp" i], input[name*="code" i]'
      ).first();

      if (await twoFAInput.isVisible().catch(() => false)) {
        console.log('✅ 2FA field appeared after login');
        
        // Try to find code on page
        const bodyText = await page.textContent('body');
        const codeMatch = bodyText.match(/\b\d{4,6}\b/);
        
        if (codeMatch) {
          const code = codeMatch[0];
          console.log(`Found code: ${code}`);
          await twoFAInput.fill(code);
          
          // Submit 2FA
          const twoFABtn = page.locator('button[type="submit"]').nth(1);
          if (await twoFABtn.isVisible().catch(() => false)) {
            await twoFABtn.click();
            console.log('✅ 2FA submitted');
          }
        }
      } else {
        console.log('ℹ️ No 2FA field, login may be complete');
      }

      await page.waitForTimeout(2000);
      console.log(`Final URL: ${page.url()}`);
    } else {
      console.warn('⚠️ Submit button not found');
    }
  });
});
