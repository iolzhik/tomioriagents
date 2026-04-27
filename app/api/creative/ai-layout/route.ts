import { NextResponse } from 'next/server';
import { generateAiComposition } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { layers, canvasSize, userPrompt, openaiKey, openRouterKey, grokKey, geminiKey, aiProvider, selectedModel } = await req.json();

    const config = {
      apiKey: aiProvider === 'openrouter' ? openRouterKey : (aiProvider === 'grok' ? grokKey : (aiProvider === 'gemini' ? geminiKey : openaiKey)),
      provider: aiProvider,
      model: selectedModel
    };

    if (!layers || !Array.isArray(layers)) {
      return NextResponse.json({ success: false, error: 'Layers data is required' }, { status: 400 });
    }

    const aiLayers = await generateAiComposition(layers, canvasSize, userPrompt, config);
    
    return NextResponse.json({ success: true, aiLayers });
  } catch (error: any) {
    console.error('Creative AI Layout API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
