import { AIConfig, getAIResponse, normalizeConfig } from '../config';
import { getMemoryBank } from '../memory';

export async function generateAiComposition(layers: any[], canvasSize: { width: number, height: number }, userPrompt?: string, configInput?: AIConfig | string) {
  const config = normalizeConfig(configInput);
  const memory = getMemoryBank('brand', config);
  const prompt = `
    SYSTEM: Creative Director. BRAND_CONTEXT: ${memory}. CANVAS: ${canvasSize.width}x${canvasSize.height}. LAYERS: ${JSON.stringify(layers)}. USER_WISHES: ${userPrompt || "None"}.
    TASK: Re-compose layers for natural high-end luxury layout. Return ONLY VALID JSON array.
  `;
  const res = await getAIResponse(prompt, config, "Creative Director");
  return JSON.parse(res.substring(res.indexOf('['), res.lastIndexOf(']')+1));
}

export async function analyzeImageWithVision(imageBase64: string, configInput?: AIConfig | string) {
  const config = normalizeConfig(configInput);
  const prompt = `Analyze this jewelry item and describe a LUXURY PHOTOGRAPHY STAGE (pedestal, lighting, background). No jewelry mentioned. Specific materials/lighting only.`;
  return await getAIResponse(prompt, config, "Vision Analyst", [imageBase64]);
}

export async function generateAiImage(prompt: string, productContext?: string, configInput?: AIConfig | string) {
  // Logic for DALL-E generation usually goes here, but we will proxy it to the main responder or a tool if necessary.
  // We keep it as a placeholder or use the main getAIResponse with a specific prompt for image gen if the provider supports it.
  throw new Error("Local image generation should be handled by a specific tool or DALL-E provider.");
}
