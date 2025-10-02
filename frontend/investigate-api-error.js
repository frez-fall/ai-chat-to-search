const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Starting investigation of API error...\n');
  
  // Launch browser with devtools
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track all API requests
  const apiRequests = [];
  const conversationsRequests = [];
  
  // Monitor network requests
  page.on('request', request => {
    const url = request.url();
    
    // Track all API requests
    if (url.includes('/api/')) {
      const requestInfo = {
        method: request.method(),
        url: url,
        headers: request.headers(),
        postData: request.postData(),
        timestamp: new Date().toISOString()
      };
      
      apiRequests.push(requestInfo);
      
      // Special tracking for conversations endpoint
      if (url.includes('/api/conversations')) {
        conversationsRequests.push(requestInfo);
        console.log(`\n🔴 FOUND /api/conversations request!`);
        console.log(`   Method: ${request.method()}`);
        console.log(`   Full URL: ${url}`);
        console.log(`   Initiator: ${request.frame().url()}`);
        
        // Log referrer header if available
        const headers = request.headers();
        if (headers.referer) {
          console.log(`   Referrer: ${headers.referer}`);
        }
      }
    }
  });
  
  // Monitor responses
  page.on('response', async response => {
    if (response.url().includes('/api/conversations')) {
      console.log(`\n📥 Response for /api/conversations:`);
      console.log(`   Status: ${response.status()} ${response.statusText()}`);
      try {
        const body = await response.text();
        console.log(`   Body: ${body}`);
      } catch (e) {
        console.log(`   Body: Could not read response body`);
      }
    }
  });
  
  // Monitor console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('api/conversations') || text.includes('500') || text.includes('user_id')) {
        console.log(`\n❌ Relevant Console Error: ${text}`);
        console.log(`   Location: ${msg.location().url}:${msg.location().lineNumber}`);
      }
    }
  });
  
  // Monitor page errors
  page.on('pageerror', error => {
    console.log(`\n❌ Page Error: ${error.message}`);
  });
  
  try {
    console.log('📍 Navigating to: https://frontend-3jb8ot36w-jaidyns-projects-60ef1157.vercel.app\n');
    
    // Navigate with network idle to catch all requests
    await page.goto('https://frontend-3jb8ot36w-jaidyns-projects-60ef1157.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('✅ Initial page load complete\n');
    
    // Check if we're on the actual app now
    const title = await page.title();
    const url = page.url();
    console.log(`📄 Current Page:`);
    console.log(`   Title: ${title}`);
    console.log(`   URL: ${url}`);
    
    // Check for main app elements
    const hasSearchWidget = await page.locator('text="Where do you want to go?"').count() > 0;
    console.log(`   Has Search Widget: ${hasSearchWidget}`);
    
    // Wait a bit more to catch any delayed requests
    console.log('\n⏳ Waiting for any delayed API calls...');
    await page.waitForTimeout(5000);
    
    // Try to trigger the chat modal to see if that causes the error
    console.log('\n🎯 Attempting to open chat modal...');
    
    // Look for search input or button
    const searchInput = await page.locator('input[placeholder*="search"], input[type="search"], input').first();
    if (await searchInput.count() > 0) {
      console.log('   Found search input, typing query...');
      await searchInput.fill('New York to London');
      
      // Look for search button
      const searchButton = await page.locator('button:has-text("Search"), button[type="submit"]').first();
      if (await searchButton.count() > 0) {
        console.log('   Clicking search button...');
        await searchButton.click();
        await page.waitForTimeout(3000);
      } else {
        // Try pressing Enter
        console.log('   Pressing Enter to submit...');
        await searchInput.press('Enter');
        await page.waitForTimeout(3000);
      }
    }
    
    // Check if chat modal opened
    const hasChatModal = await page.locator('[role="dialog"], .modal, [class*="chat"]').count() > 0;
    console.log(`   Chat Modal Opened: ${hasChatModal}`);
    
  } catch (error) {
    console.error('\n❌ Navigation/Interaction error:', error.message);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 INVESTIGATION SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\nTotal API requests captured: ${apiRequests.length}`);
  
  if (conversationsRequests.length > 0) {
    console.log(`\n🔴 Found ${conversationsRequests.length} request(s) to /api/conversations:`);
    conversationsRequests.forEach((req, i) => {
      console.log(`\nRequest #${i + 1}:`);
      console.log(`  Method: ${req.method}`);
      console.log(`  URL: ${req.url}`);
      console.log(`  Time: ${req.timestamp}`);
      if (req.postData) {
        console.log(`  Body: ${req.postData}`);
      }
    });
  } else {
    console.log('\n✅ No requests to /api/conversations were detected');
  }
  
  console.log('\nAll API endpoints called:');
  const uniqueEndpoints = [...new Set(apiRequests.map(r => `${r.method} ${r.url.split('?')[0]}`))];
  uniqueEndpoints.forEach(endpoint => {
    console.log(`  - ${endpoint}`);
  });
  
  console.log('\n⏸️  Keeping browser open for 20 seconds for manual inspection...');
  console.log('Check the Network tab in DevTools for more details.\n');
  
  await page.waitForTimeout(20000);
  
  await browser.close();
  console.log('✅ Investigation complete\n');
})();