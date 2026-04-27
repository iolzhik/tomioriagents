import { NextResponse } from 'next/server';
import { getAIResponse } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { provider, apiKey, model } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Ключ не предоставлен' }, { status: 400 });
    }

    const testPrompt = "Ping! Respond with 'Connected' only.";
    const response = await getAIResponse(testPrompt, { provider, apiKey, model });

    if (response) {
      return NextResponse.json({ success: true, message: 'Соединение установлено!' });
    }
  } catch (error: any) {
    console.error('Test Connection Error:', error);
    return NextResponse.json({ 
       success: false, 
       error: error.message || 'Ошибка проверки ключа. Проверьте правильность и баланс.' 
    }, { status: 200 });
  }
}
