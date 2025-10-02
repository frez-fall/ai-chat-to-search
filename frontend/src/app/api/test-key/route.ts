import { NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function GET() {
  try {
    // Get the API key
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Debug info (safely)
    const keyInfo = {
      exists: !!apiKey,
      length: apiKey?.length || 0,
      prefix: apiKey?.substring(0, 7) || 'missing',
      suffix: apiKey ? apiKey.substring(apiKey.length - 4) : 'none',
      envKeys: Object.keys(process.env).filter(k => k.includes('OPENAI')),
    };
    
    // Try to make a simple API call
    let testResult = 'not tested';
    if (apiKey) {
      try {
        const openai = createOpenAI({
          apiKey: apiKey,
        });
        
        const { text } = await generateText({
          model: openai('gpt-3.5-turbo'),
          prompt: 'Say "test successful"',
          maxTokens: 10,
        });
        
        testResult = text;
      } catch (error: any) {
        testResult = `Error: ${error.message}`;
      }
    }
    
    return NextResponse.json({
      keyInfo,
      testResult,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}