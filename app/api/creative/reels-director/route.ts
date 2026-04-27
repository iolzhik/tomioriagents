import { NextResponse } from 'next/server';
import { getAIResponse } from '@/lib/openai';

const REELS_DIRECTOR_DNA = `
    You are the Lead Creative Director for Tomiori, a high-end luxury jewelry brand.
    Your task is to create a professional technical production guide for a Reels video.
    
    CRITICAL: 
    1. The tone must be ELITE, MYSTERIOUS, and UNDERSTATED. 
    2. Avoid generic marketing clichés like "роскошь", "совершенство", "изменит всё". 
    3. Use poetic, evocative, and precise Russian language.
    4. Focus on the emotional connection and the "soul" of the jewelry.
    5. All text fields MUST be in Russian.
    6. Technical settings MUST be professional (Log, 4K, specific ISO, etc.).

    The output MUST be a valid JSON object with this exact structure:
    {
      "title": "...",
      "hook": { "visual": "...", "text": "..." },
      "techSettings": "...",
      "scenes": [
        { "time": "0-3s", "visual": "...", "lighting": "...", "action": "...", "text": "..." }
      ],
      "audio": { "music": "...", "asmr": "...", "voiceover": "..." },
      "editing": "...",
      "directorNote": "..."
    }
  `;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      concept, 
      device, 
      lighting, 
      mood, 
      pacing, 
      location, 
      asmr, 
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

    const deviceSpecs: Record<string, string> = {
      iphone_14_pro: 'iPhone 14 Pro: Use 48MP main sensor, 4K 30fps Cinematic Mode, f/1.8. Recommended: Apple Log (if possible) or Vivid profile.',
      iphone_15_pro: 'iPhone 15 Pro: Use Log recording (ProRes), 4K 60fps, ACES color space. Recommend external SSD for long shoots. Focus on USB-C speed.',
      iphone_16_pro: 'iPhone 16 Pro Max: Use GenAI-assisted focus, 4K 120fps for super slow-mo, zero shutter lag. Extreme macro mode for jewelry facets.',
      iphone_17_pro: 'iPhone 17 Pro Max (Concept/Future): Use Quad-pixel 100MP sensor, AI-automated depth-of-field, 8K Log. Perfect skin-tone rendering.',
      sony_a7iv: 'Sony A7IV: 10-bit 4:2:2, S-Log3, 35mm or 90mm Macro lens. Focus on bokeh and low-light performance.',
      red_komodo: 'RED Komodo/V-Raptor: 6K/8K RAW, global shutter. Cinematic dynamic range. Requires professional grading.'
    };

    const systemPrompt = `Вы — главный креативный директор и технический консультант Tomiori (Астана). 
Ваша задача — превратить концепцию в профессиональный ПЛАН СЪЕМКИ REELS.
${REELS_DIRECTOR_DNA}
ТЕХНИЧЕСКИЙ КОНТЕКСТ: Съемка на ${deviceSpecs[device] || 'профессиональное устройство'}. 
ОСВЕЩЕНИЕ: ${lighting}. НАСТРОЕНИЕ: ${mood}. ТЕМП: ${pacing}. ЛОКАЦИЯ: ${location}.
Фокусируйтесь на высококонверсионных хуках, кинематографичном свете и люксовом ASMR.
ОТВЕЧАЙТЕ СТРОГО НА РУССКОМ ЯЗЫКЕ.`;

    const userPrompt = `Разработай детальный сценарий Reels для: "${concept || 'Jewelry lifestyle'}"

Формат JSON (без markdown):
{
  "title": "Короткое цепляющее название",
  "hook": {
    "visual": "Описание визуального хука (первые 3 сек)",
    "text": "Текст на экране"
  },
  "techSettings": "Конкретные настройки камеры для ${device} (FPS, разрешение, ISO, объектив)",
  "scenes": [
    {
      "time": "0-3с",
      "visual": "Описание кадра",
      "lighting": "Схема света (rim, key, fill)",
      "action": "Действие модели/продукта",
      "text": "Текст на экране"
    }
  ],
  "audio": {
    "music": "Жанр/настроение музыки",
    "asmr": "Детали звуков ASMR",
    "voiceover": "Текст закадрового голоса (если есть)"
  },
  "editing": "Советы по монтажу, переходы",
  "directorNote": "Главный совет для маркетолога"
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
