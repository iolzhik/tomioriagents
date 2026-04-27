import { NextResponse } from 'next/server';
import { RAGEngine } from '@/lib/rag-engine';

export async function POST(req: Request) {
  try {
    const { query, config } = await req.json();

    if (!query) {
      return NextResponse.json({ success: false, error: 'Query required' }, { status: 400 });
    }

    const rag = new RAGEngine(config);
    const answer = await rag.tomioriChat(query);

    return NextResponse.json({ success: true, answer });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    const msg = String(error?.message || '');
    if (error?.status === 429 || /429|rate limit|tokens per min|TPM/i.test(msg)) {
      return NextResponse.json({
        success: false,
        error: 'Лимит модели по токенам превышен. Укоротите запрос или выберите более лёгкую модель.'
      }, { status: 200 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
