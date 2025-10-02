const { test, expect } = require('@playwright/test');

test('Check application homepage and identify issues', async ({ page }) => {
  console.log('Starting application test...');
  
  // Navigate to the application
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  
  // Take a screenshot for analysis
  await page.screenshot({ path: 'app-screenshot.png', fullPage: true });
  console.log('Screenshot saved as app-screenshot.png');
  
  // Check for console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // Check page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for main elements
  const hasSearchInput = await page.locator('input[type="text"], input[type="search"]').count() > 0;
  console.log('Has search input:', hasSearchInput);
  
  // Check for chat elements
  const hasChatElements = await page.locator('[class*="chat"], [id*="chat"]').count() > 0;
  console.log('Has chat elements:', hasChatElements);
  
  // Check for any error messages displayed
  const errorElements = await page.locator('text=/error|failed|unable/i').all();
  if (errorElements.length > 0) {
    console.log('Found error messages on page:');
    for (const elem of errorElements) {
      console.log('-', await elem.textContent());
    }
  }
  
  // Check network requests for failures
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()
    });
  });
  
  // Wait a bit to catch any async errors
  await page.waitForTimeout(3000);
  
  // Report findings
  console.log('\n=== ISSUES FOUND ===');
  if (consoleErrors.length > 0) {
    console.log('Console errors:', consoleErrors);
  }
  if (failedRequests.length > 0) {
    console.log('Failed network requests:', failedRequests);
  }
  
  // Get page content for analysis
  const pageContent = await page.content();
  console.log('\nPage content length:', pageContent.length, 'characters');
  
  // Check for React error boundary
  const hasReactError = await page.locator('text=/Application error|Something went wrong/i').count() > 0;
  if (hasReactError) {
    console.log('React error boundary triggered!');
  }
  
  // Check API endpoints
  try {
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/chat');
        return {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    console.log('API /api/chat status:', apiResponse);
  } catch (error) {
    console.log('Could not check API:', error.message);
  }
});