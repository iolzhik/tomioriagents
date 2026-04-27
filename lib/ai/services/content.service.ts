import { AIConfig, getAIResponse, normalizeConfig } from '../config';
import { getMemoryBank } from '../memory';

export async function generateJewelryCaption(itemType: string, keywords: string, configInput?: AIConfig | string) {
  const config = normalizeConfig(configInput);
  const memory = getMemoryBank('brand', config);
  const prompt = `Item: ${itemType}, Keywords: ${keywords}. Generate high-end seductive caption in Russian.`;
  return await getAIResponse(prompt, config, "Tomiori Brand Voice");
}

export async function generateSocialCaptions(rawInfo: string, configInput?: AIConfig | string) {
  const config = normalizeConfig(configInput);
  const memory = getMemoryBank('brand', config);
  const prompt = `BRAND_CONTEXT: ${memory}. USER_INPUT: ${rawInfo}. Write 2 Instagram captions in Russian (short/punchy).`;
  return await getAIResponse(prompt, config, "Tomiori Copywriter");
}

export async function generateStoryScenario(input: { productName: string, target: string, focus?: string }, configInput?: AIConfig | string) {
  const config = normalizeConfig(configInput);
  const memory = getMemoryBank('brand', config);
  const prompt = `PRODUCT: ${input.productName}, TARGET: ${input.target}, FOCUS: ${input.focus}. Create Instagram Story JSON scenario.`;
  const res = await getAIResponse(prompt, config, "Story Creative Director");
  return JSON.parse(res.substring(res.indexOf('{'), res.lastIndexOf('}')+1));
}

export async function generateContentPlan(params: { days: number, posts: number, reels: number, stories: number }, configInput?: AIConfig | string) {
  const config = normalizeConfig(configInput);
  const brandMemory = getMemoryBank('brand', config);
  const prompt = `
Create a detailed ${params.days}-day content plan for Tomiori (premium jewelry brand, Astana).
Output language: Russian.

Business targets:
- Increase qualified leads from Instagram/WhatsApp
- Increase store visits and high-ticket inquiries
- Reinforce premium positioning

Volume constraints:
- posts: ${params.posts}
- reels: ${params.reels}
- stories: ${params.stories}

BRAND_CONTEXT:
${brandMemory}

Return STRICT JSON ONLY (no markdown, no comments) using this schema:
{
  "title": "string",
  "strategySummary": "3-6 sentence executive summary",
  "weeklyGoals": ["string", "string"],
  "days": [
    {
      "day": 1,
      "theme": "string",
      "dayGoal": "what this day should achieve",
      "audienceIntent": "desire/problem of target client",
      "content": [
        {
          "type": "post|reel|story",
          "title": "string",
          "description": "detailed concept (at least 2 sentences)",
          "visualBrief": "camera/shot/style directions",
          "hook": "strong first line",
          "caption": "ready-to-post caption",
          "cta": "clear call to action",
          "kpi": "metric to track",
          "offerAngle": "why client should act now"
        }
      ]
    }
  ]
}
`;
  return await getAIResponse(prompt, config, "Content Plan Strategist");
}

export async function generateSalesFunnel(promptText?: string, configInput?: AIConfig | string) {
  const config = normalizeConfig(configInput);
  const brandMemory = getMemoryBank('brand', config);
  const prompt = `
Create a robust sales funnel for Tomiori (premium jewelry, Kazakhstan).
User context: ${promptText || 'None'}
BRAND_CONTEXT:
${brandMemory}

Output language: Russian only.
Important: every human-readable field must be in Russian (title, description, stage names, goals, ideas, scripts, offers, KPI explanations).
Do NOT use English words unless they are unavoidable brand/platform names.

Return STRICT JSON ONLY (no markdown), schema:
{
  "title": "string",
  "description": "2-4 sentence overview",
  "stages": [
    {
      "name": "stage name",
      "goal": "business objective",
      "audienceState": "what client thinks/feels at this stage",
      "platforms": ["Instagram", "WhatsApp", "Offline boutique"],
      "contentIdeas": ["specific tactic 1", "specific tactic 2", "specific tactic 3"],
      "scripts": ["example message/script"],
      "offer": "offer for this stage",
      "objectionHandling": ["objection -> response"],
      "kpi": "main metric",
      "owner": "role responsible",
      "duration": "expected timeframe"
    }
  ]
}
`;
  return await getAIResponse(prompt, config, "Funnel Architect");
}

export async function generateHijackDM(
  competitorInfo: string,
  followerUsername: string,
  configInput?: AIConfig | string
) {
  const config = normalizeConfig(configInput);
  const memory = getMemoryBank('brand', config);
  const prompt = `
BRAND_CONTEXT: ${memory}
COMPETITOR_INFO: ${competitorInfo}
TARGET_FOLLOWER: ${followerUsername}
TASK: Напиши короткий персональный Instagram DM на русском языке для премиального бренда украшений Tomiori.
Тон: уверенный, тёплый, ненавязчивый.
Формат: только текст сообщения без пояснений.
`;
  return await getAIResponse(prompt, config, "Tomiori DM Closer");
}
