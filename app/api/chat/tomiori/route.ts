import { NextResponse } from 'next/server';
import { RAGEngine } from '@/lib/rag-engine';

/**
 * SPECIALIZED TOMIORI CHATBOT API (v4.0)
 * Answers ONLY about Tomiori business based on RAG knowledge
 */
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
    const engine = new RAGEngine(config);
    const answer = await engine.tomioriChat(query);
    
    return NextResponse.json({ 
      success: true, 
      answer,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Tomiori Chat API Error:', error);
    const msg = String(error?.message || '');
    if (error?.status === 429 || /429|rate limit|tokens per min|TPM/i.test(msg)) {
      return NextResponse.json({
        success: false,
        error: 'Лимит модели по токенам превышен. Попробуйте короче запрос или менее тяжёлую модель (например, gpt-4o-mini / gemini-2.5-flash).'
      }, { status: 200 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
