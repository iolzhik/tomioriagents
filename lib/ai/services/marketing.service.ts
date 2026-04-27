import { AIConfig, getAIResponse, normalizeConfig } from '../config';
import { getMemoryBank } from '../memory';

export async function metaAdsConsultant(query: string, configInput?: AIConfig | string) {
  const config = normalizeConfig(configInput);
  const memory = getMemoryBank('brand', config);
  const prompt = `
    SYSTEM: Эксперт по рекламе Meta. BRAND_CONTEXT: ${memory}.
    ЗАПРОС: ${query}.
    ЗАДАЧА: МАКСИМАЛЬНО ДЕТАЛЬНЫЙ технический план рекламной кампании (CBO, ABO, AdSets, Creative Matrix) в русском языке. 
    БЮДЖЕТ: 12 000 - 18 000 KZT в день.
  `;
  return await getAIResponse(prompt, config, "Meta Ads Strategist");
}
