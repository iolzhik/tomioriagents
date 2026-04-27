import { NextResponse } from 'next/server';
import { metaAdsConsultant } from '@/lib/openai';
import { RAGEngine } from '@/lib/rag-engine';

export async function POST(req: Request) {
  const { query, openaiKey, openRouterKey, grokKey, geminiKey, aiProvider, selectedModel } = await req.json();

  const config = {
    apiKey: aiProvider === 'openrouter' ? openRouterKey : (aiProvider === 'grok' ? grokKey : (aiProvider === 'gemini' ? geminiKey : openaiKey)),
    provider: aiProvider,
    model: selectedModel
  };

  if (!query) {
    return NextResponse.json({ success: false, error: 'Query required' }, { status: 400 });
  }

  try {
    const advice = await metaAdsConsultant(query, config);
    
    // Self-Learning: Save ads advice to Memory Bank
    if (advice) {
      const rag = new RAGEngine(config);
      await rag.learnFromSystemOutput('ads', `Ads Consultation: ${query}`, advice);
    }

    return NextResponse.json({ 
      success: true, 
      advice,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Ads API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
