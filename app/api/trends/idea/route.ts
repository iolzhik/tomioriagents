
import { NextResponse } from 'next/server';
import { generateTrendIdea } from '@/lib/openai';
import { RAGEngine } from '@/lib/rag-engine';

export async function POST(req: Request) {
  const { trend, openaiKey, openRouterKey, grokKey, geminiKey, aiProvider, selectedModel } = await req.json();

  const config = {
    apiKey: aiProvider === 'openrouter' ? openRouterKey : (aiProvider === 'grok' ? grokKey : (aiProvider === 'gemini' ? geminiKey : openaiKey)),
    provider: aiProvider,
    model: selectedModel
  };

  if (!trend) {
    return NextResponse.json({ success: false, error: 'Trend data is required' }, { status: 400 });
  }

  try {
    const idea = await generateTrendIdea(trend, config);

    // Self-Learning: Save trend idea to Memory Bank
    if (idea) {
      const rag = new RAGEngine(config);
      await rag.learnFromSystemOutput('trends', `Trend Idea for: ${trend.title || 'Unknown Trend'}`, idea);
    }

    return NextResponse.json({ success: true, idea });
  } catch (error: any) {
    console.error('Trend Idea API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
