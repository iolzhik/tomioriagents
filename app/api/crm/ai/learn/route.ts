import { NextResponse } from 'next/server';
import { RAGEngine } from '@/lib/rag-engine';

export async function POST(req: Request) {
  try {
    const { data, fileName, mimeType, config } = await req.json();

    if (!data) {
      return NextResponse.json({ success: false, error: 'Data required' }, { status: 400 });
    }

    const rag = new RAGEngine(config);
    const structuredInfo = await rag.ingestData(data, fileName || 'Manual Input', mimeType || 'text/plain');

    return NextResponse.json({ success: true, info: structuredInfo });
  } catch (error: any) {
    console.error('Learn API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
