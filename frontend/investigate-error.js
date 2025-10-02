const { chromium } = require('playwright');

(async () => {
  // Launch browser with devtools to see network activity
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track all network requests
  const requests = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`📡 API Request: ${request.method()} ${request.url()}`);
      console.log(`   Headers:`, request.headers());
      requests.push({
        method: request.method(),
        url: request.url(),
        headers: request.headers(),
        postData: request.postData()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/conversations')) {
      console.log(`📥 Response for ${response.url()}: ${response.status()}`);
      response.text().then(body => {
        console.log(`   Body:`, body);
      }).catch(() => {});
    }
  });
  
  // Log console messages from the page
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error:`, msg.text());
    }
  });
  
  // Navigate to your deployed site
  console.log('\n🌐 Navigating to site...\n');
  
  try {
    // First, let's try the main URL
    await page.goto('https://frontend-3jb8ot36w-jaidyns-projects-60ef1157.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('✅ Page loaded successfully\n');
    
    // Wait a bit to catch any delayed requests
    await page.waitForTimeout(5000);
    
    // Check if we're on authentication page
    const pageContent = await page.content();
    if (pageContent.includes('Authentication Required') || pageContent.includes('Vercel Authentication')) {
      console.log('🔐 Site requires authentication - this is expected for Vercel preview deployments\n');
    }
    
    // Try to access the API directly
    console.log('\n🔍 Testing API endpoint directly...\n');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/conversations');
        const text = await response.text();
        return {
          status: response.status,
          statusText: response.statusText,
          body: text,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('API Direct Test Result:', JSON.stringify(apiResponse, null, 2));
    
  } catch (error) {
    console.error('Navigation error:', error.message);
  }
  
  // Summary of findings
  console.log('\n📊 Summary of API requests found:');
  requests.forEach(req => {
    console.log(`- ${req.method} ${req.url}`);
  });
  
  console.log('\n⏸️  Keeping browser open for 30 seconds for manual inspection...');
  console.log('You can inspect the Network tab in DevTools to see all requests.');
  
  await page.waitForTimeout(30000);
  
  await browser.close();
  console.log('✅ Investigation complete');
})();