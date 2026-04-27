import { NextResponse } from 'next/server';
import { RAGEngine } from '@/lib/rag-engine';

/**
 * PRODUCTION-GRADE KNOWLEDGE UPLOAD (v4.0)
 * Handles PDF, XLSX, Images, and Text for RAG Ingestion
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;
    const openaiKey = formData.get('openaiKey') as string;
    const openRouterKey = formData.get('openRouterKey') as string;
    const grokKey = formData.get('grokKey') as string;
    const geminiKey = formData.get('geminiKey') as string;
    const aiProvider = formData.get('aiProvider') as 'openai' | 'openrouter' | 'grok' | 'gemini';
    const selectedModel = formData.get('selectedModel') as string;

    const config = {
      apiKey: aiProvider === 'openrouter' ? openRouterKey : (aiProvider === 'grok' ? grokKey : (aiProvider === 'gemini' ? geminiKey : openaiKey)),
      provider: aiProvider,
      model: selectedModel
    };

    console.log(`[API Knowledge] Upload started. File: ${file?.name}, Text length: ${text?.length}`);

    if (!config.apiKey) {
      return NextResponse.json({ success: false, error: 'API Key не найден в запросе. Пожалуйста, введите его в настройках.' }, { status: 400 });
    }

    const engine = new RAGEngine(config);
    let structuredInfo = '';

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      structuredInfo = await engine.ingestData(buffer, file.name, file.type);
    } else if (text && text.trim()) {
      structuredInfo = await engine.ingestData(text, 'Manual Input');
    } else {
      return NextResponse.json({ success: false, error: 'Файл или текст не предоставлены.' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Знания успешно поглощены и добавлены в мозг RAG',
      structuredPreview: structuredInfo.substring(0, 500) + '...'
    });

  } catch (error: any) {
    console.error('[API Knowledge Error]', error);
    return NextResponse.json({ success: false, error: error.message || 'Внутренняя ошибка сервера при поглощении знаний' }, { status: 500 });
  }
}
