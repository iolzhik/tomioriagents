
import { NextResponse } from 'next/server';
import { analyzePostEffectiveness } from '@/lib/openai';
import { RAGEngine } from '@/lib/rag-engine';

export async function POST(req: Request) {
  const { post, openaiKey, openRouterKey, grokKey, geminiKey, aiProvider, selectedModel } = await req.json();

  const config = {
    apiKey: aiProvider === 'openrouter' ? openRouterKey : (aiProvider === 'grok' ? grokKey : (aiProvider === 'gemini' ? geminiKey : openaiKey)),
    provider: aiProvider,
    model: selectedModel
  };

  if (!post || !post.caption || !post.mediaType) {
    return NextResponse.json({ success: false, error: 'Post data is required' }, { status: 400 });
  }

  try {
    const analysis = await analyzePostEffectiveness(post, config);

    // Self-Learning: Save analysis to Memory Bank
    if (analysis) {
      const rag = new RAGEngine(config);
      await rag.learnFromSystemOutput('post_analysis', `Post Analysis: ${post.caption.substring(0, 30)}...`, analysis);
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    console.error('Post Analysis API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
