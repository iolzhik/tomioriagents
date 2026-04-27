import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AIConfig {
  apiKey?: string;
  provider?: 'openai' | 'openrouter' | 'grok' | 'gemini';
  model?: string;
}

export function normalizeConfig(config?: AIConfig | string): AIConfig {
  if (typeof config === 'string') {
    return { apiKey: config, provider: 'openai' };
  }
  return config || {};
}

function getClient(config: AIConfig = {}) {
  let finalKey = config.apiKey;
  let baseURL = undefined;

  if (config.provider === 'openrouter') {
    finalKey = finalKey || process.env.OPENROUTER_API_KEY;
    baseURL = 'https://openrouter.ai/api/v1';
  } else if (config.provider === 'grok') {
    finalKey = finalKey || process.env.GROK_API_KEY;
    baseURL = 'https://api.x.ai/v1';
  } else if (config.provider === 'gemini') {
    finalKey = finalKey || process.env.GEMINI_API_KEY;
    baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
  } else {
    finalKey = finalKey || process.env.OPENAI_API_KEY;
  }

  if (!finalKey || finalKey.length < 5) {
     throw new Error(`Invalid API Key for ${config.provider || 'openai'}. Please provide a valid key in Settings.`);
  }

  return new OpenAI({
    apiKey: finalKey,
    baseURL,
    dangerouslyAllowBrowser: true,
    timeout: 60000,
  });
}

export async function getAIResponse(prompt: string, configInput?: AIConfig | string, systemMessage = "Tomiori AI", images: string[] = []) {
  const config = normalizeConfig(configInput);
  
  if (config.provider === 'gemini') {
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.length < 5) throw new Error("Invalid API Key for Gemini.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const MODEL_FALLBACKS: Record<string, string[]> = {
      'gemini-2.5-flash':       ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'],
      'gemini-2.5-pro':         ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
      'gemini-3-flash-preview': ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.0-flash'],
      'gemini-3-pro-preview':   ['gemini-3-pro-preview', 'gemini-2.5-pro', 'gemini-2.5-flash'],
      'gemini-2.0-flash':       ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'],
      'gemini-1.5-flash':       ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'],
      'gemini-1.5-pro':         ['gemini-1.5-pro', 'gemini-2.5-pro', 'gemini-2.5-flash'],
    };
    const requestedModel = config.model || 'gemini-2.5-flash';
    const tryModels = MODEL_FALLBACKS[requestedModel] || [requestedModel, 'gemini-2.5-flash', 'gemini-2.0-flash'];

    let lastError: any;
    for (const modelName of tryModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        let content: any[] = [`${systemMessage}\n\n${prompt}`];
        if (images && images.length > 0) {
          images.forEach(img => {
            if (img.startsWith('data:')) {
              const [header, data] = img.split(',');
              const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
              content.push({ inlineData: { data, mimeType } });
            }
          });
        }
        const result = await model.generateContent(content);
        const response = await result.response;
        return response.text().replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, "");
      } catch (e: any) {
        lastError = e;
        if (!(e.message?.includes('404') || e.status === 404)) throw e;
      }
    }
    throw new Error(`Gemini Unavailable: ${lastError?.message}`);
  }

  const openai = getClient(config);
  let model = config.model;
  if (config.provider === 'grok') {
    if (!model || !model.startsWith('grok')) model = 'grok-2-1212';
  } else if (config.provider === 'openrouter') {
    if (!model) model = 'anthropic/claude-3.5-sonnet';
  } else {
    if (!model || model.includes('/') || model.startsWith('gemini') || model.startsWith('grok')) model = 'gpt-4o';
  }

  const messages: any[] = [{ role: "system", content: systemMessage }];
  if (images && images.length > 0) {
    const userContent: any[] = [{ type: "text", text: prompt }];
    images.forEach(img => userContent.push({ type: "image_url", image_url: { url: img } }));
    messages.push({ role: "user", content: userContent });
  } else {
    messages.push({ role: "user", content: prompt });
  }

  const res = await openai.chat.completions.create({ model: model!, messages });
  return (res.choices[0].message.content || "").replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, "");
}
