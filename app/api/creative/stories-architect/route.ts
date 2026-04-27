import { NextResponse } from 'next/server';
import { getAIResponse } from '@/lib/openai';

const STORIES_ARCHITECT_DNA = `
    You are the Lead Digital Architect for Tomiori, a luxury jewelry brand.
    Your task is to design a high-conversion, luxury-tier 5-slide Story series.
    
    CRITICAL: 
    1. The tone must be ELITE, MYSTERIOUS, and UNDERSTATED. 
    2. Avoid generic marketing clichés. 
    3. Use poetic, evocative, and precise Russian language.
    4. Focus on building a "journey of desire".
    5. All text fields MUST be in Russian.
    6. PROMPT ATTENTION: Pay EXTREME attention to the user's specific prompt. If they mention prices (e.g., 200,000 KZT), specific sales funnels, or "low-cost" items, you MUST reflect this in the strategic hook, narrative, and CTAs while maintaining the luxury feel. Do NOT ignore numerical values or specific business goals provided by the user.

    The output MUST be a valid JSON object with this exact structure:
    {
      "goal": "...",
      "narrative": "...",
      "strategicHook": "...",
      "series": [
        { "slide": 1, "visual": "...", "text": "...", "sticker": "...", "placement": "...", "cta": "..." }
      ],
      "visualCodes": "...",
      "proTip": "..."
    }
  `;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      goal, 
      seriesType, 
      tone, 
      interactive, 
      aiProvider, 
      selectedModel, 
      openaiKey, 
      geminiKey, 
      openRouterKey, 
      grokKey 
    } = body;

    const config = {
      apiKey:
        aiProvider === 'gemini' ? (geminiKey || process.env.GEMINI_API_KEY) :
        aiProvider === 'openrouter' ? openRouterKey :
        aiProvider === 'grok' ? grokKey : openaiKey,
      provider: (aiProvider || 'gemini') as 'openai' | 'gemini' | 'openrouter' | 'grok',
      model: selectedModel || 'gemini-2.5-flash',
    };

    const systemPrompt = `Вы — руководитель стратегии Stories для Tomiori.
Ваша цель — создать серию Stories, ориентированную на вовлечение.
${STORIES_ARCHITECT_DNA}
СТРАТЕГИЧЕСКИЙ КОНТЕКСТ: Тип серии: ${seriesType}. Цель: ${goal}. Тон: ${tone}. Уровень интерактива: ${interactive}.
Фокусируйтесь на визуальной элегантности и стратегии высококонверсионных стикеров.
ОТВЕЧАЙТЕ СТРОГО НА РУССКОМ ЯЗЫКЕ.`;

    const userPrompt = `Спроектируй серию из 5 Stories для: "${goal || 'General brand awareness'}"

Формат JSON (без markdown):
{
  "goal": "Чего мы достигаем",
  "narrative": "Краткое описание сюжетной линии",
  "strategicHook": "Психологический триггер, используемый в этой серии",
  "series": [
    {
      "slide": 1,
      "visual": "Детальное описание видео/фото в стиле Tomiori",
      "text": "Основной текст на слайде",
      "sticker": "Тип стикера и конкретный вопрос/варианты",
      "placement": "Совет по композиции (безопасные зоны, позиция стикера)",
      "cta": "Призыв к действию"
    }
  ],
  "visualCodes": "Цвета, шрифты и советы по верстке из брендбука Tomiori",
  "proTip": "Хак для роста охватов именно для этой серии ${seriesType}"
}`;

    const raw = await getAIResponse(userPrompt, config, systemPrompt);
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}') + 1;
      result = JSON.parse(raw.substring(start, end));
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
