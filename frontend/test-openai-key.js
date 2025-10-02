// Test script to verify OpenAI API key
const https = require('https');

// Get the API key from command line argument
const apiKey = process.argv[2];

if (!apiKey) {
  console.log('❌ Usage: node test-openai-key.js YOUR_OPENAI_API_KEY');
  process.exit(1);
}

console.log('🔍 Testing OpenAI API key...\n');
console.log(`Key format: ${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`);

// Test the key with a simple API call
const data = JSON.stringify({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Say hello' }],
  max_tokens: 10
});

const options = {
  hostname: 'api.openai.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    const response = JSON.parse(responseData);
    
    if (res.statusCode === 200) {
      console.log('✅ API Key is VALID!');
      console.log('Response:', response.choices[0].message.content);
    } else {
      console.log(`❌ API Key is INVALID or there's an issue`);
      console.log(`Status Code: ${res.statusCode}`);
      console.log('Error:', response.error || response);
      
      if (response.error?.code === 'invalid_api_key') {
        console.log('\n⚠️  The API key is invalid. Please check:');
        console.log('1. The key is correct (no extra spaces)');
        console.log('2. The key hasn\'t been revoked');
        console.log('3. You\'re using the correct OpenAI account');
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Connection error:', error.message);
});

req.write(data);
req.end();