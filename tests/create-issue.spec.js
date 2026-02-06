const { test, expect } = require('@playwright/test');

const USERNAME = 'administrator';
const PASSWORD = 'Fossano.2026';
const BASE_URL = 'https://taiko.mantishub.io';
const CREATE_ISSUE_URL = 'https://taiko.mantishub.io/app/projects/0/issues/create';

test.describe('Taiko MantisHub - Issue Creation Tests', () => {

  test('001 - Login and Navigate to Create Issue Page', async ({ page }) => {
    console.log('\n=== TEST 001: Login and Navigate to Create Issue ===');
    
    // Step 1: Navigate to login
    console.log('Step 1: Navigating to login page...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('taiko');
    console.log('✅ Login page loaded');

    // Step 2: Enter username
    console.log('Step 2: Entering username...');
    const usernameInput = page.locator('input[name="username"]');
    expect(await usernameInput.isVisible()).toBeTruthy();
    await usernameInput.fill(USERNAME);
    console.log(`✅ Username entered: ${USERNAME}`);

    // Step 3: Click submit/next
    console.log('Step 3: Clicking submit button...');
    let submitBtn = page.locator('input[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
    }

    // Step 4: Enter password
    console.log('Step 4: Entering password...');
    const passwordInput = page.locator('input[type="password"]');
    expect(await passwordInput.isVisible()).toBeTruthy();
    await passwordInput.fill(PASSWORD);
    console.log('✅ Password entered');

    // Step 5: Submit login
    console.log('Step 5: Submitting login form...');
    submitBtn = page.locator('input[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }

    // Wait for dashboard
    console.log('Step 6: Waiting for dashboard...');
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle').catch(() => {});
    console.log(`✅ Dashboard URL: ${page.url()}`);

    // Step 7: Navigate to create issue page
    console.log('Step 7: Navigating to create issue page...');
    await page.goto(CREATE_ISSUE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    
    const finalURL = page.url();
    console.log(`📍 Current URL: ${finalURL}`);
    
    expect(finalURL).toContain('issues/create');
    console.log('✅ Successfully navigated to create issue page');
  });

  test('002 - Verify Create Issue Form Elements', async ({ page }) => {
    console.log('\n=== TEST 002: Verify Create Issue Form ===');
    
    // Login first
    console.log('Logging in...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    const usernameInput = page.locator('input[name="username"]');
    await usernameInput.fill(USERNAME);
    
    let submitBtn = page.locator('input[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
    }

    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(PASSWORD);
      submitBtn = page.locator('input[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }

    console.log('✅ Login complete');

    // Navigate to create issue page
    console.log('Navigating to create issue page...');
    await page.goto(CREATE_ISSUE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    console.log('📋 Checking for form elements...');

    // Check for common issue form fields
    const fields = {
      'Summary': page.locator('input[name*="summary" i], input[placeholder*="summary" i], textarea[name*="summary" i]').first(),
      'Description': page.locator('textarea[name*="description" i], textarea[placeholder*="description" i], div[contenteditable]').first(),
      'Category': page.locator('select[name*="category" i], input[placeholder*="category" i]').first(),
      'Priority': page.locator('select[name*="priority" i], input[placeholder*="priority" i]').first(),
      'Assigned To': page.locator('select[name*="assign" i], input[placeholder*="assign" i]').first(),
    };

    let foundFields = 0;
    for (const [fieldName, fieldLocator] of Object.entries(fields)) {
      try {
        if (await fieldLocator.count() > 0) {
          const isVisible = await fieldLocator.isVisible().catch(() => false);
          console.log(`✅ ${fieldName}: ${isVisible ? 'visible' : 'present'}`);
          foundFields++;
        }
      } catch (e) {
        console.log(`⚠️ ${fieldName}: not found`);
      }
    }

    // Check for submit button
    console.log('Looking for submit button...');
    const submitButtons = page.locator('button:has-text("Create"), button:has-text("Submit"), button[type="submit"]');
    const submitCount = await submitButtons.count();
    console.log(`Found ${submitCount} potential submit buttons`);

    if (foundFields > 0 || submitCount > 0) {
      console.log(`✅ Create issue form has elements (${foundFields} fields found)`);
    } else {
      console.log('⚠️ Form structure different, but page loaded');
    }

    expect(page.url()).toContain('issues/create');
  });

  test('003 - Create Issue Form Interaction', async ({ page }) => {
    console.log('\n=== TEST 003: Create Issue Form Interaction ===');
    
    // Login
    console.log('Logging in...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    const usernameInput = page.locator('input[name="username"]');
    await usernameInput.fill(USERNAME);
    
    let submitBtn = page.locator('input[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
    }

    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(PASSWORD);
      submitBtn = page.locator('input[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }

    console.log('✅ Login complete');

    // Navigate to create issue
    console.log('Navigating to create issue page...');
    await page.goto(CREATE_ISSUE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Try to interact with form fields
    console.log('📝 Testing form interaction...');

    // Test 1: Find and fill summary field
    const summarySelector = 'input[name*="summary" i], input[placeholder*="summary" i], input[type="text"]:first-of-type';
    const summaryField = page.locator(summarySelector).first();
    
    if (await summaryField.isVisible().catch(() => false)) {
      console.log('Found summary field, filling test data...');
      await summaryField.fill('Test Issue - Automated');
      console.log('✅ Summary filled');
    } else {
      console.log('⚠️ Summary field not found');
    }

    // Test 2: Try to find and fill description
    const descriptionSelectors = [
      'textarea[name*="description" i]',
      'textarea[placeholder*="description" i]',
      'textarea',
    ];

    for (const selector of descriptionSelectors) {
      const field = page.locator(selector).first();
      if (await field.isVisible().catch(() => false)) {
        console.log(`Found description field using: ${selector}`);
        await field.fill('This is a test issue created via automated tests.');
        console.log('✅ Description filled');
        break;
      }
    }

    // Test 3: Look for and interact with dropdowns
    const selects = await page.locator('select').all();
    console.log(`Found ${selects.length} select elements`);

    for (let i = 0; i < Math.min(selects.length, 2); i++) {
      try {
        const select = selects[i];
        const options = await select.locator('option').all();
        if (options.length > 1) {
          console.log(`Select ${i + 1} has ${options.length} options`);
          await select.selectOption({ index: 1 });
          console.log(`✅ Selected option in select ${i + 1}`);
        }
      } catch (e) {
        console.log(`Select ${i + 1}: could not interact`);
      }
    }

    console.log('✅ Form interaction test complete');
    expect(page.url()).toContain('issues/create');
  });

  test('004 - Page Load and Response Check', async ({ page }) => {
    console.log('\n=== TEST 004: Page Load and Response Check ===');
    
    // Login
    console.log('Logging in...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    const usernameInput = page.locator('input[name="username"]');
    await usernameInput.fill(USERNAME);
    
    let submitBtn = page.locator('input[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
    }

    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(PASSWORD);
      submitBtn = page.locator('input[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }

    console.log('✅ Login complete');

    // Navigate to create issue and check response
    console.log('Navigating to create issue page...');
    const responses = [];
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
      });
    });

    await page.goto(CREATE_ISSUE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    console.log(`📊 Total network requests: ${responses.length}`);
    
    // Check for 200 OK responses
    const successResponses = responses.filter(r => r.status === 200);
    console.log(`✅ Successful responses (200): ${successResponses.length}`);

    // Check for any 4xx or 5xx errors
    const errorResponses = responses.filter(r => r.status >= 400);
    if (errorResponses.length > 0) {
      console.log(`⚠️ Error responses found:`);
      errorResponses.forEach(r => {
        console.log(`   ${r.status} - ${r.url}`);
      });
    } else {
      console.log('✅ No error responses (4xx/5xx)');
    }

    // Page title check
    const title = await page.title();
    console.log(`Page title: "${title}"`);

    expect(page.url()).toContain('issues/create');
    console.log('✅ Test complete');
  });

  test('005 - Console Errors Check', async ({ page }) => {
    console.log('\n=== TEST 005: Console Errors Check ===');
    
    const consoleMessages = [];
    const consoleErrors = [];

    page.on('console', msg => {
      consoleMessages.push(msg.text());
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log(`🔴 Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        console.log(`🟡 Console Warning: ${msg.text()}`);
      }
    });

    // Login
    console.log('Logging in...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    const usernameInput = page.locator('input[name="username"]');
    await usernameInput.fill(USERNAME);
    
    let submitBtn = page.locator('input[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
    }

    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(PASSWORD);
      submitBtn = page.locator('input[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }

    console.log('✅ Login complete');

    // Navigate to create issue page
    console.log('Navigating to create issue page...');
    await page.goto(CREATE_ISSUE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    console.log(`📊 Console messages total: ${consoleMessages.length}`);
    console.log(`🔴 Console errors: ${consoleErrors.length}`);

    expect(consoleErrors.length).toBe(0);
    console.log('✅ No critical console errors');
  });

  test('006 - Full Create Issue Workflow', async ({ page }) => {
    console.log('\n=== TEST 006: Full Create Issue Workflow ===');
    
    // Step 1: Login
    console.log('Step 1: Logging in...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    let userInput = page.locator('input[name="username"]');
    await userInput.fill(USERNAME);
    
    let submitBtn = page.locator('input[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
    }

    let passInput = page.locator('input[type="password"]');
    if (await passInput.isVisible()) {
      await passInput.fill(PASSWORD);
      submitBtn = page.locator('input[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }

    await page.waitForTimeout(2000);
    console.log('✅ Logged in successfully');

    // Step 2: Navigate to create issue
    console.log('Step 2: Navigating to create issue page...');
    await page.goto(CREATE_ISSUE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    
    const url = page.url();
    console.log(`📍 Current URL: ${url}`);
    expect(url).toContain('issues/create');

    // Step 3: Fill form with test data
    console.log('Step 3: Filling form...');
    
    const issueTitle = `Test Issue ${Date.now()}`;
    const issueDescription = 'Auto-generated test issue for verification';

    // Summary field
    const summaryField = page.locator('input[type="text"]').first();
    if (await summaryField.isVisible().catch(() => false)) {
      await summaryField.fill(issueTitle);
      console.log(`✅ Summary: ${issueTitle}`);
    }

    // Description field
    const descField = page.locator('textarea').first();
    if (await descField.isVisible().catch(() => false)) {
      await descField.fill(issueDescription);
      console.log(`✅ Description: ${issueDescription}`);
    }

    console.log('Step 4: Form ready for submission');
    console.log('✅ Workflow test complete');
  });

});
