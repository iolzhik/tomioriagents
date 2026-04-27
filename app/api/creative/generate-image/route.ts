import { NextResponse } from 'next/server';
import { generateAiImage, analyzeImageWithVision } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { prompt, productPhoto, openaiKey, openRouterKey, grokKey, geminiKey, aiProvider, selectedModel } = await req.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    const config = {
      apiKey: aiProvider === 'openrouter' ? openRouterKey : (aiProvider === 'grok' ? grokKey : (aiProvider === 'gemini' ? geminiKey : openaiKey)),
      provider: aiProvider,
      model: selectedModel
    };

    let productContext = "";
    if (productPhoto) {
      try {
        productContext = await analyzeImageWithVision(productPhoto, config);
      } catch (e) {
        console.error("Vision analysis failed, proceeding with text only", e);
      }
    }

    // DALL-E 3 is only available via OpenAI. 
    // If current provider is OpenAI, use it. Otherwise, fallback to env key or openaiKey.
    const dallEConfig = aiProvider === 'openai' 
      ? config 
      : { apiKey: process.env.OPENAI_API_KEY || openaiKey, provider: 'openai' as const };
    
    const imageUrl = await generateAiImage(prompt, productContext, dallEConfig);
    
    return NextResponse.json({ success: true, url: imageUrl, productContext });
  } catch (error: any) {
    console.error('Image Generation API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
