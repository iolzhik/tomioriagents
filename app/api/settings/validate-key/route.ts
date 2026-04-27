import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const { apiKey, provider } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API Key is required' }, { status: 400 });
    }

    let baseURL = undefined;
    let model = 'gpt-4o-mini';

    if (provider === 'openrouter') {
      baseURL = 'https://openrouter.ai/api/v1';
      model = 'openai/gpt-4o-mini';
    } else if (provider === 'grok') {
      baseURL = 'https://api.x.ai/v1';
      model = 'grok-beta';
    } else if (provider === 'gemini') {
      baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
      model = 'gemini-2.5-flash';
    }

    const client = new OpenAI({
      apiKey: apiKey,
      baseURL,
    });

    // Простой запрос для проверки валидности ключа
    await client.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: 'Say OK' }],
      max_tokens: 5,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error(`Validation Error (${req.url}):`, error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Invalid API Key or Provider error' 
    }, { status: 200 }); // Возвращаем 200, чтобы фронтенд мог обработать ошибку в success: false
  }
}
