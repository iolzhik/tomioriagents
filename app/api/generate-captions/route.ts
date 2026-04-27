import { NextResponse } from 'next/server';
import { generateSocialCaptions } from '@/lib/openai';
import { RAGEngine } from '@/lib/rag-engine';

export async function POST(req: Request) {
  try {
    const { rawInfo, openaiKey, openRouterKey, grokKey, geminiKey, aiProvider, selectedModel } = await req.json();

    const config = {
      apiKey: aiProvider === 'openrouter' ? openRouterKey : (aiProvider === 'grok' ? grokKey : (aiProvider === 'gemini' ? geminiKey : openaiKey)),
      provider: aiProvider,
      model: selectedModel
    };

    if (!config.apiKey) {
      return NextResponse.json({ success: false, error: 'API Key is required' }, { status: 400 });
    }

    const captions = await generateSocialCaptions(rawInfo, config);

    // Self-Learning: Save captions to Memory Bank
    if (captions) {
      const rag = new RAGEngine(config);
      await rag.learnFromSystemOutput('caption', `Caption Generation for: ${rawInfo.substring(0, 30)}...`, captions);
    }

    return NextResponse.json({ 
      success: true, 
      captions,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Caption Generation API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
