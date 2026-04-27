
import { NextResponse } from 'next/server';
import { generateStoryScenario } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { productName, target, focus, openaiKey, openRouterKey, grokKey, geminiKey, aiProvider, selectedModel } = await req.json();

    const config = {
      apiKey: aiProvider === 'openrouter' ? openRouterKey : (aiProvider === 'grok' ? grokKey : (aiProvider === 'gemini' ? geminiKey : openaiKey)),
      provider: aiProvider,
      model: selectedModel
    };

    if (!config.apiKey) {
      return NextResponse.json({ success: false, error: 'API Key required' }, { status: 400 });
    }

    const story = await generateStoryScenario({ productName, target, focus }, config);

    return NextResponse.json({ success: true, story });

  } catch (error: any) {
    console.error('[API Story Error]', error);
    return NextResponse.json({ 
      success: false, 
      error: `Ошибка генерации: ${error.message}` 
    }, { status: 500 });
  }
}
