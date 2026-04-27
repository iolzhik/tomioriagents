import { AIConfig, getAIResponse, normalizeConfig } from '../config';
import { getMemoryBank } from '../memory';

export async function analyzeCompetitor(profileUrl: string, postData: any[], configInput?: AIConfig | string, websiteText?: string, isSimulated?: boolean) {
   const config = normalizeConfig(configInput);
   const memory = getMemoryBank('brand', config);
   const postInsights = isSimulated ? [] : postData.slice(0, 12).map(p => ({
     caption: p.caption || "Нет текста",
     engagement: `Likes: ${p.likes || 'N/A'}, Comments: ${p.comments || 'N/A'}`,
     type: p.url?.includes('video') ? 'Video/Reel' : 'Image/Carousel'
   }));
   const prompt = `
    SYSTEM: Элитный Стратег по Конкурентной Разведке Tomiori.
    BRAND_CONTEXT: ${memory}. TARGET_URL: ${profileUrl}.
    POST_DATA: ${JSON.stringify(postInsights)}.
    TASK: Разберите конкурента на части (ДНК, вовлеченность, уязвимости) в русском языке. Детально.
   `;
   return await getAIResponse(prompt, config, "Competitive Intelligence Analyst");
}

export async function classifyConversation(messages: {text: string, from: string}[], configInput?: AIConfig | string): Promise<'new' | 'contacted' | 'negotiation' | 'closed_won' | 'closed_lost'> {
  const config = normalizeConfig(configInput);
  const lastMessages = messages.slice(-3).map(m => m.text.toLowerCase()).join(' ');
  if (lastMessages.includes('цена') || lastMessages.includes('сколько стоит') || lastMessages.includes('₸') || lastMessages.includes('тенге')) return 'contacted';
  if (lastMessages.includes('хочу купить') || lastMessages.includes('заказать')) return 'negotiation';

  const prompt = `Analyze conversation for Tomiori Sales Funnel stage. Stages: new, contacted, negotiation, closed_won, closed_lost. Messages: ${messages.map(m => m.from + ': ' + m.text).join('\n')}. Return only the stage name.`;
  const res = (await getAIResponse(prompt, config, "CRM Analyst")).toLowerCase();
  if (res.includes('negotiation')) return 'negotiation';
  if (res.includes('contacted')) return 'contacted';
  if (res.includes('closed_won')) return 'closed_won';
  if (res.includes('closed_lost')) return 'closed_lost';
  return 'new';
}

export async function generateTrendIdea(trend: any, configInput?: AIConfig | string) {
  const config = normalizeConfig(configInput);
  const memory = getMemoryBank('brand', config);
  const prompt = `SYSTEM: Viral Content Strategist. BRAND_CONTEXT: ${memory}. TREND: ${JSON.stringify(trend)}. TASK: Generate a seductive Instagram idea for Kazakhstan luxury market in Russian.`;
  return await getAIResponse(prompt, config, "Viral Content Strategist");
}

export async function analyzePostEffectiveness(post: {caption: string, mediaType: string}, configInput?: AIConfig | string) {
  const config = normalizeConfig(configInput);
  const memory = getMemoryBank('brand', config);
  const prompt = `Analyze post effectiveness for Tomiori. POST_DATA: ${JSON.stringify(post)}. Provide virality score and recommendations in Russian.`;
  return await getAIResponse(prompt, config, "Instagram Growth Hacker");
}
