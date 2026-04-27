import { NextResponse } from 'next/server';
import { generateSalesFunnel } from '@/lib/openai';
import { RAGEngine } from '@/lib/rag-engine';

function coerceFunnel(raw: unknown) {
  if (!raw) throw new Error("AI returned empty response");
  if (typeof raw === 'object') return raw as any;

  const text = String(raw);
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not find JSON structure in AI response");
    return JSON.parse(match[0]);
  }
}

function normalizeFunnel(rawFunnel: any) {
  if (!rawFunnel || typeof rawFunnel !== 'object') {
    throw new Error('AI response is not a valid funnel object');
  }

  const stagesRaw = Array.isArray(rawFunnel.stages)
    ? rawFunnel.stages
    : Array.isArray(rawFunnel.funnel)
      ? rawFunnel.funnel
      : Array.isArray(rawFunnel.steps)
        ? rawFunnel.steps
        : [];

  if (stagesRaw.length === 0) {
    throw new Error("AI response is missing funnel stages");
  }

  const stages = stagesRaw.map((s: any, idx: number) => ({
    name: s?.name || s?.stage || `Этап ${idx + 1}`,
    goal: s?.goal || s?.description || s?.objective || 'Повысить вероятность перехода на следующий этап.',
    audienceState: s?.audienceState || s?.state || '',
    platforms: Array.isArray(s?.platforms) ? s.platforms : (Array.isArray(s?.channels) ? s.channels : []),
    contentIdeas: Array.isArray(s?.contentIdeas) ? s.contentIdeas : (Array.isArray(s?.actions) ? s.actions : []),
    scripts: Array.isArray(s?.scripts) ? s.scripts : [],
    offer: s?.offer || '',
    objectionHandling: Array.isArray(s?.objectionHandling) ? s.objectionHandling : [],
    kpi: s?.kpi || s?.metric || '',
    owner: s?.owner || '',
    duration: s?.duration || '',
  }));

  return {
    title: rawFunnel.title || 'Воронка продаж Tomiori',
    description: rawFunnel.description || 'Пошаговая воронка для перевода аудитории из интереса в покупку.',
    stages,
  };
}

export async function POST(req: Request) {
  try {
    const { query, openaiKey, openRouterKey, grokKey, geminiKey, aiProvider, selectedModel } = await req.json();

    const config = {
      apiKey: aiProvider === 'openrouter' ? openRouterKey : (aiProvider === 'grok' ? grokKey : (aiProvider === 'gemini' ? geminiKey : openaiKey)),
      provider: aiProvider,
      model: selectedModel
    };

    if (!query) {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    // 1. Context Injection (Web Scraping / Research)
    // In a production environment, we'd use a search engine API here
    const webContext = "Market: Luxury Jewelry in Kazakhstan. Competition: EPL Diamond, Damiani, Cartier Astana. Trends: Personalization, Sustainable Diamonds, QR-Code unboxing.";

    // 2. AI Funnel Architect
    const funnelRaw = await generateSalesFunnel(query, config);
    
    let funnel;
    try {
      funnel = normalizeFunnel(coerceFunnel(funnelRaw));

      if (!funnel.stages || !Array.isArray(funnel.stages)) {
        throw new Error("AI response is missing 'stages' array");
      }

      // 3. Self-Learning: Save strategy to Memory Bank
      const rag = new RAGEngine(config);
      await rag.learnFromSystemOutput('funnel', `Strategic Funnel for: ${query}`, JSON.stringify(funnel));
    
      return NextResponse.json({ success: true, funnel });
    } catch (e: any) {
      console.error('Funnel JSON Parse Error:', e.message, 'Raw response:', funnelRaw);
      return NextResponse.json({ 
        success: false, 
        error: `Ошибка обработки стратегии: ${e.message}. Попробуйте другую модель.` 
      }, { status: 200 });
    }

  } catch (error: any) {
    console.error('Funnel Generation API Error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, error: 'AI returned an invalid JSON format. Please try again.' }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
