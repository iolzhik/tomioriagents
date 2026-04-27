
import { NextResponse } from 'next/server';
import { generateHijackDM } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { competitorInfo, followerUsername, openaiKey, openRouterKey, grokKey, geminiKey, aiProvider, selectedModel } = await req.json();

    const config = {
      apiKey: aiProvider === 'openrouter' ? openRouterKey : (aiProvider === 'grok' ? grokKey : (aiProvider === 'gemini' ? geminiKey : openaiKey)),
      provider: aiProvider,
      model: selectedModel
    };

    if (!config.apiKey) {
      return NextResponse.json({ success: false, error: 'API Key required' }, { status: 400 });
    }

    const dm = await generateHijackDM(competitorInfo, followerUsername, config);

    return NextResponse.json({ success: true, dm });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
