import { NextResponse } from 'next/server';
import { generateContentPlan, generateSalesFunnel } from '@/lib/openai';
import { RAGEngine } from '@/lib/rag-engine';
import { getAIResponse } from '@/lib/ai/config';

function coercePlan(raw: unknown) {
  if (!raw) throw new Error("AI returned empty response");
  if (typeof raw === 'object') return raw as any;

  const text = String(raw);
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not find JSON structure in AI response");
    return JSON.parse(jsonMatch[0]);
  }
}

function normalizeContentPlan(rawPlan: any, requestedDays?: number) {
  if (!rawPlan || typeof rawPlan !== 'object') {
    throw new Error("AI response is not a valid object");
  }

  const candidates = [
    rawPlan.days,
    rawPlan.plan?.days,
    rawPlan.contentPlan?.days,
    rawPlan.schedule?.days,
    rawPlan.items,
    rawPlan.plan,
  ];

  let daysArray = candidates.find((c) => Array.isArray(c)) as any[] | undefined;

  // Some models return shape: { day1: {...}, day2: {...} }
  if (!daysArray) {
    const maybeDayEntries = Object.entries(rawPlan).filter(([k]) =>
      /^day[\s_-]?\d+$/i.test(k)
    );
    if (maybeDayEntries.length > 0) {
      daysArray = maybeDayEntries
        .sort((a, b) => {
          const na = Number(String(a[0]).match(/\d+/)?.[0] || 0);
          const nb = Number(String(b[0]).match(/\d+/)?.[0] || 0);
          return na - nb;
        })
        .map(([, value]) => value);
    }
  }

  // Root array case
  if (!daysArray && Array.isArray(rawPlan)) {
    daysArray = rawPlan;
  }

  if (!daysArray || !Array.isArray(daysArray) || daysArray.length === 0) {
    throw new Error("AI response is missing 'days' array");
  }

  const normalizeItem = (item: any, idx: number) => {
    if (typeof item === 'string') {
      return {
        type: 'post',
        title: item.slice(0, 80) || `Идея #${idx + 1}`,
        description: item,
        hook: '',
        caption: item,
      };
    }

    const rawType = String(item?.type || item?.format || item?.kind || '').toLowerCase();
    const normalizedType = rawType.includes('reel') ? 'reel' : rawType.includes('story') ? 'story' : 'post';
    const title = item?.title || item?.name || item?.topic || item?.headline || `Идея #${idx + 1}`;
    const description = item?.description || item?.concept || item?.text || item?.idea || 'Контент-идея для публикации.';
    const hook = item?.hook || item?.cta || item?.opening || '';
    const caption = item?.caption || item?.copy || item?.postText || description;

    const visualBrief = item?.visualBrief || item?.visual || item?.shotPlan || '';
    const cta = item?.cta || item?.callToAction || '';
    const kpi = item?.kpi || item?.metric || '';
    const offerAngle = item?.offerAngle || item?.offer || '';

    return { type: normalizedType, title, description, hook, caption, visualBrief, cta, kpi, offerAngle };
  };

  const collectItems = (dayObj: any): any[] => {
    if (Array.isArray(dayObj?.content)) return dayObj.content;
    if (Array.isArray(dayObj?.items)) return dayObj.items;
    if (Array.isArray(dayObj?.posts)) return dayObj.posts.map((p: any) => ({ ...p, type: p?.type || 'post' }));
    if (Array.isArray(dayObj?.reels)) return dayObj.reels.map((p: any) => ({ ...p, type: p?.type || 'reel' }));
    if (Array.isArray(dayObj?.stories)) return dayObj.stories.map((p: any) => ({ ...p, type: p?.type || 'story' }));

    const mixed = [dayObj?.post, dayObj?.reel, dayObj?.story].filter(Boolean);
    if (mixed.length > 0) return mixed;

    if (dayObj?.description || dayObj?.concept || dayObj?.text) {
      return [{
        type: 'post',
        title: dayObj?.theme || dayObj?.title || 'Контент дня',
        description: dayObj?.description || dayObj?.concept || dayObj?.text,
        caption: dayObj?.caption || '',
      }];
    }

    return [];
  };

  const normalizedDays = daysArray.map((rawDay: any, idx: number) => {
    const fallbackDayNumber = idx + 1;

    if (typeof rawDay === 'string') {
      return {
        day: fallbackDayNumber,
        theme: rawDay.trim() || `Тема дня ${fallbackDayNumber}`,
        content: [
          {
            type: 'post',
            title: `Публикация дня ${fallbackDayNumber}`,
            description: rawDay.trim() || 'Контент-идея на день.',
            hook: '',
            caption: rawDay.trim() || 'Новый день, новая публикация от Tomiori.',
          },
        ],
      };
    }

    const dayRaw = rawDay?.day ?? rawDay?.dayNumber ?? rawDay?.index ?? fallbackDayNumber;
    const dayNumber = typeof dayRaw === 'number'
      ? dayRaw
      : Number(String(dayRaw).match(/\d+/)?.[0] || fallbackDayNumber);

    const theme =
      rawDay?.theme ||
      rawDay?.title ||
      rawDay?.topic ||
      rawDay?.focus ||
      rawDay?.dayTitle ||
      `Тема дня ${dayNumber}`;

    let content = collectItems(rawDay).map(normalizeItem).filter((i: any) => i.title || i.description);
    if (content.length === 0) {
      content = [{
        type: 'post',
        title: `Публикация дня ${dayNumber}`,
        description: 'Контент-идея сформирована автоматически из неполного ответа модели.',
        hook: '',
        caption: 'Новый день, новая публикация от Tomiori.',
      }];
    }

    return { day: dayNumber, theme, content };
  });

  if (requestedDays && normalizedDays.length < requestedDays) {
    for (let i = normalizedDays.length + 1; i <= requestedDays; i++) {
      normalizedDays.push({
        day: i,
        theme: `Тема дня ${i}`,
        content: [{
          type: 'post',
          title: `Публикация дня ${i}`,
          description: 'Добавьте идею вручную или перегенерируйте план.',
          hook: '',
          caption: 'Tomiori вдохновляет каждый день.',
        }],
      });
    }
  }

  return {
    title: rawPlan.title || rawPlan.name || `Контент-план на ${requestedDays || daysArray.length} дней`,
    strategySummary: rawPlan.strategySummary || rawPlan.summary || '',
    weeklyGoals: Array.isArray(rawPlan.weeklyGoals) ? rawPlan.weeklyGoals : [],
    days: normalizedDays,
  };
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

function collectPlanTexts(plan: any): string[] {
  const texts: string[] = [];
  if (!plan || typeof plan !== 'object') return texts;
  const add = (v: any) => { if (typeof v === 'string' && v.trim()) texts.push(v); };
  add(plan.title);
  add(plan.strategySummary);
  if (Array.isArray(plan.weeklyGoals)) plan.weeklyGoals.forEach(add);
  if (Array.isArray(plan.days)) {
    for (const day of plan.days) {
      add(day?.theme);
      add(day?.dayGoal);
      add(day?.audienceIntent);
      if (Array.isArray(day?.content)) {
        for (const item of day.content) {
          add(item?.title);
          add(item?.description);
          add(item?.visualBrief);
          add(item?.hook);
          add(item?.caption);
          add(item?.cta);
          add(item?.kpi);
          add(item?.offerAngle);
        }
      }
    }
  }
  return texts;
}

function needsRussianRewrite(plan: any): boolean {
  const texts = collectPlanTexts(plan);
  if (texts.length === 0) return false;
  const joined = texts.join(' ');
  const cyr = (joined.match(/[А-Яа-яЁё]/g) || []).length;
  const lat = (joined.match(/[A-Za-z]/g) || []).length;
  return lat > cyr * 0.35;
}

async function forceRussianPlan(plan: any, config: any): Promise<any> {
  if (!needsRussianRewrite(plan)) return plan;
  const rewritePrompt = `
Перепиши переданный JSON контент-плана полностью на русский язык.
Требования:
- Переведи ВСЕ человекочитаемые поля на русский.
- Сохрани исходную структуру и ключи JSON.
- Не добавляй и не удаляй поля.
- Верни STRICT JSON ONLY без markdown.

JSON:
${JSON.stringify(plan)}
`;
  const rewrittenRaw = await getAIResponse(rewritePrompt, config, 'Russian Content Plan Localizer');
  return normalizeContentPlan(coercePlan(rewrittenRaw), Array.isArray(plan?.days) ? plan.days.length : undefined);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, prompt, openaiKey, openRouterKey, grokKey, geminiKey, aiProvider, selectedModel } = body;
    
    // Handle both direct params and nested planParams
    const planData = body.planParams || body;
    const { days, posts, reels, stories } = planData;

    const providerMapping: any = {
      'openai': 'openai',
      'gemini': 'gemini',
      'grok': 'grok',
      'openrouter': 'openrouter'
    };

    const config = {
      apiKey: aiProvider === 'openrouter' ? openRouterKey : (aiProvider === 'grok' ? grokKey : (aiProvider === 'gemini' ? geminiKey : openaiKey)),
      provider: providerMapping[aiProvider] || 'openai',
      model: selectedModel
    };

    if (type === 'funnel') {
      const funnelRaw = await generateSalesFunnel(prompt, config);
      const funnelNormalized = normalizeFunnel(coercePlan(funnelRaw));
      const funnel = needsRussianRewrite(funnelNormalized)
        ? await forceRussianPlan(
            {
              title: funnelNormalized.title,
              strategySummary: funnelNormalized.description,
              weeklyGoals: [],
              days: funnelNormalized.stages.map((s: any, idx: number) => ({
                day: idx + 1,
                theme: s.name,
                content: [{
                  type: 'post',
                  title: s.goal,
                  description: s.audienceState,
                  visualBrief: (s.platforms || []).join(', '),
                  hook: '',
                  caption: (s.contentIdeas || []).join(' | '),
                  cta: s.offer || '',
                  kpi: s.kpi || '',
                  offerAngle: (s.objectionHandling || []).join(' | '),
                }],
              })),
            },
            config
          ).then((localized: any) => ({
            ...funnelNormalized,
            title: localized?.title || funnelNormalized.title,
            description: localized?.strategySummary || funnelNormalized.description,
            stages: funnelNormalized.stages.map((s: any, idx: number) => ({
              ...s,
              name: localized?.days?.[idx]?.theme || s.name,
              goal: localized?.days?.[idx]?.content?.[0]?.title || s.goal,
              audienceState: localized?.days?.[idx]?.content?.[0]?.description || s.audienceState,
              platforms: (localized?.days?.[idx]?.content?.[0]?.visualBrief || '')
                .split(',')
                .map((x: string) => x.trim())
                .filter(Boolean) || s.platforms,
              contentIdeas: (localized?.days?.[idx]?.content?.[0]?.caption || '')
                .split('|')
                .map((x: string) => x.trim())
                .filter(Boolean) || s.contentIdeas,
              offer: localized?.days?.[idx]?.content?.[0]?.cta || s.offer,
              objectionHandling: (localized?.days?.[idx]?.content?.[0]?.offerAngle || '')
                .split('|')
                .map((x: string) => x.trim())
                .filter(Boolean) || s.objectionHandling,
              kpi: localized?.days?.[idx]?.content?.[0]?.kpi || s.kpi,
            })),
          }))
        : funnelNormalized;
      // Self-Learning: Save funnel to Memory Bank
      const rag = new RAGEngine(config);
      await rag.learnFromSystemOutput('funnel', `Sales Funnel Strategy: ${prompt || 'General'}`, JSON.stringify(funnel));
      return NextResponse.json({ success: true, plan: funnel });
    }


    if (!days) {
      return NextResponse.json({ success: false, error: 'Days parameter is required' }, { status: 400 });
    }

    const planRaw = await generateContentPlan({ days, posts, reels, stories }, config);

    
    let plan;
    try {
      plan = normalizeContentPlan(coercePlan(planRaw), days);
      plan = await forceRussianPlan(plan, config);

      // Self-Learning: Save content plan to Memory Bank
      const rag = new RAGEngine(config);
      await rag.learnFromSystemOutput('content', `Content Plan (${days} days)`, JSON.stringify(plan));

      return NextResponse.json({ success: true, plan });
    } catch (e: any) {
      console.error('JSON Parse Error:', e.message, 'Raw response:', planRaw);
      return NextResponse.json({ 
        success: false, 
        error: `Ошибка обработки ответа ИИ: ${e.message}. Попробуйте другую модель или сократите период.` 
      }, { status: 200 }); // Still 200 but with success: false for frontend alert
    }
  } catch (error: any) {
    console.error('Content Plan API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
