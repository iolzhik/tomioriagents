import { NextResponse } from 'next/server';
import { getAIResponse } from '@/lib/openai';
import fs from 'fs';
import path from 'path';

// ─── TOMIORI BRAND DNA (from visual analysis of reference images) ───────────
const BRAND_DNA = `
TOMIORI VISUAL DNA (analyzed from brand reference images):

COLOR PALETTE:
- Primary dark: Deep petrol/emerald green #0C4A4F → #0B3B3F (velvet, plush)
- Forest green: #1A5230 → #0F3B25 (nature, moss, foliage)
- Cool neutral: Pale blue-grey #D3E0E8 → #A8BFC9 (studio editorial)
- Accent: Rose petals, warm gold reflections, diamond sparkle

THREE SIGNATURE SCENE TYPES:
TYPE A — NATURE/ORGANIC: Deep forest green bg, moss-covered surfaces, blurred ferns/foliage, 
  dappled natural light, ring/jewel on natural wood surface, organic textures, serene mood
TYPE B — ON PERSON/EDITORIAL: Model in profile or close body part (hand/ear/neck/wrist), 
  dramatic hard directional lighting from right, strong shadow sculpting, cool blue-grey studio bg,
  high-contrast chiaroscuro, powerful/mysterious mood
TYPE C — PRODUCT NEUTRAL: Jewelry on dark petrol-green or black velvet/marble surface,
  soft diffused studio light, macro sparkle focus, clean minimal composition, luxury box optional

LIGHTING SIGNATURES:
- Type A: Soft ambient + focused sparkle light on stone, natural diffusion
- Type B: Hard key light from right, deep shadows left side, rim light optional
- Type C: Soft box above + slight side fill, drop shadow, macro starburst on diamond

ALWAYS: Tomiori logo top-center, gold serif typography. Product and logo = separate layers.
`;

// ─── PRODUCT → SCENE MAPPING ────────────────────────────────────────────────
const PRODUCT_SCENE_MAP: Record<string, string> = {
  ring:             'elegant female hand, empty fingers, no jewelry, fingers slightly curved',
  engagement_ring:  'elegant female hand, empty ring finger extended, soft skin, no jewelry',
  wedding_band:     'two elegant hands together, empty fingers, intimate close-up',
  necklace:         'elegant female bare décolleté and neck, no necklace, collarbone visible',
  pendant:          'elegant female bare neck, slight profile, no pendant, skin lit warmly',
  earrings_studs:   'elegant female ear and jawline in profile, empty earlobe, no earring',
  earrings_drop:    'elegant female ear and neck profile, empty earlobe, hair swept back',
  earrings_hoop:    'elegant female ear profile, empty earlobe, clean jawline',
  bracelet:         'elegant female wrist and hand, empty wrist, no bracelet, relaxed pose',
  tennis_bracelet:  'elegant female wrist turned upward, empty wrist, soft skin',
  brooch:           'luxury dark fabric lapel or velvet surface, no brooch, clean area',
  tiara:            'elegant female head/hair profile, no tiara, hair styled up',
  set:              'luxury dark velvet tray with multiple empty positions, top-down view',
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      sceneType,       // 'nature' | 'editorial' | 'neutral'
      product,
      productDescription,
      focus,
      frame,
      colorPalette,
      metalTone,
      lighting,
      mood,
      textOverlay,
      textContent,
      extraNotes,
      productImage,    // Base64
      logoImage,       // Base64
      geminiKey,
      openaiKey,
      openRouterKey,
      grokKey,
      aiProvider,
      selectedModel,
    } = body;

    const config = {
      apiKey:
        aiProvider === 'gemini' ? (geminiKey || process.env.GEMINI_API_KEY) :
        aiProvider === 'openrouter' ? openRouterKey :
        aiProvider === 'grok' ? grokKey : openaiKey,
      provider: (aiProvider || 'gemini') as 'openai' | 'gemini' | 'openrouter' | 'grok',
      model: selectedModel || 'gemini-2.5-flash',
    };

    let brandMemory = '';
    try {
      const memPath = path.join(process.cwd(), 'knowledge', 'tomiori_memory.md');
      if (fs.existsSync(memPath)) brandMemory = fs.readFileSync(memPath, 'utf8').substring(0, 1500);
    } catch (e) {}

    const productScene = PRODUCT_SCENE_MAP[product] || 'luxury empty stage, clear focal center';

    const sceneInstructions: Record<string, string> = {
      nature: `TYPE A — NATURE/ORGANIC SCENE:
Background: Deep forest green #1A5230 to #0F3B25, blurred moss-covered tree trunk, soft ferns and foliage bokeh
Surface: Natural wood or dark stone where product will rest / body part is positioned
Light: Soft ambient forest light + focused sparkle light on the focal point (where product layer goes)
Texture: Organic — moss, bark, leaves, dew drops, natural depth
Mood: Serene, timeless, natural luxury`,

      editorial: `TYPE B — ON PERSON / EDITORIAL SCENE:
Background: Cool blue-grey studio gradient #D3E0E8 to #A8BFC9, seamless backdrop
Body: ${productScene}
Light: Hard directional key light from RIGHT side, deep shadow on LEFT, strong chiaroscuro sculpting
Optional: Subtle rim light from behind for separation
Mood: Powerful, mysterious, high-fashion, confident`,

      neutral: `TYPE C — PRODUCT ON NEUTRAL SURFACE:
Background: Deep petrol-green #0C4A4F to #0B3B3F OR rich black velvet, smooth and plush
Surface: Dark velvet, black marble, or dark stone — completely clear center for product layer
Light: Soft box from above + slight side fill, drop shadow, macro starburst potential on focal point
Optional: Open luxury Tomiori jewelry box in frame, rose petals accent
Mood: Elite, intimate, celebratory, desire-inducing`,
    };

    const systemPrompt = `You are the chief creative director and AI prompt engineer for Tomiori luxury jewelry brand (Astana, Kazakhstan).
You write hyper-precise Nano Banana AI image generation prompts that produce stunning, on-brand results every time.
${BRAND_DNA}
BRAND CONTEXT: ${brandMemory}

CRITICAL RULES:
1. STRICT PRODUCT ADHERENCE: If the product is '${product}', the scene MUST be designed for a '${product}'. 
   - NEVER suggest a hand or finger if the product is a necklace/pendant. 
   - If product is 'necklace', the editorial scene MUST show a neck/décolleté.
2. ANALYSIS: If images are provided, observe the style, stones, and metal. Ensure the background scene prompt complements its specific design.
3. BACKGROUND ONLY: You are generating a BACKGROUND ONLY. Describe a VACANT focal pedestal or area where the product will be placed later. 
4. LOGO: The top-center area MUST be clean for the attached logo.`;

    const userPrompt = `Generate a Nano Banana background scene prompt for Tomiori.

INPUTS:
- Scene Type: ${sceneType}
- Product: ${product} (CRITICAL: Only focus on this product type)
- Product Details: ${productDescription || 'Luxury item'}
- Camera Focus: ${focus}
- Frame: ${frame}
- Color Palette: ${colorPalette}
- Metal Tone: ${metalTone}
- Lighting Override: ${lighting}
- Mood: ${mood}
- Text Zone: ${textOverlay}${textContent ? ` — "${textContent}"` : ''}
${extraNotes ? `- Extra Notes: ${extraNotes}` : ''}

⚠️ NANO BANANA LAYER SYSTEM (MANDATORY):
This prompt = BACKGROUND SCENE ONLY.
→ The ${product} jewelry will be attached as a SEPARATE LAYER by the user.
→ The Tomiori logo will be attached as a SEPARATE LAYER by the user (TOP-CENTER).
→ DO NOT render any jewelry, logo, or text in the scene.
→ The scene must describe a VACANT focal area (e.g., an empty neck, an empty hand, or an empty pedestal) specifically for a ${product}.

SCENE CONSTRUCTION (FOLLOW STRICTLY):
${sceneInstructions[sceneType] || sceneInstructions['neutral']}

BODY/STAGE CONTEXT:
${product === 'necklace' || product === 'pendant' ? 'FOR NECKLACE: Show only the elegant bare neck and décolleté area. NO HANDS, NO FINGERS, NO RINGS.' : ''}
${product === 'ring' ? 'FOR RING: Show only the elegant bare hand and fingers. NO NECK, NO EARS.' : ''}
The body part shown must be: ${productScene}. Skin is flawless, NO jewelry visible.

OUTPUT — raw JSON only, no markdown fences:
{
  "mainPrompt": "Ultra-detailed Nano Banana background scene prompt in English, 350-500 words. Describe an EMPTY photography stage or body part (${productScene}). Explicitly mention a 'vacant focal area' designed specifically for a ${product} layer. Describe how the lighting is set up to illuminate the jewelry that will be placed there. Ensure the top-center is a clean negative space for the logo. DO NOT MENTION RINGS IF THE PRODUCT IS A NECKLACE. End with: '— [SCENE READY FOR ATTACHED ${product.toUpperCase()} LAYER] — [SCENE READY FOR ATTACHED LOGO LAYER AT TOP-CENTER]'",
  "negativePrompt": "no ${product}, no jewelry, no rings, no necklaces, no earrings, no bracelets, no logo, no text, no watermark, no brand name, ${product === 'necklace' ? 'no hands, no fingers' : ''} — plus: ${sceneType === 'nature' ? 'no urban elements, no studio look' : sceneType === 'editorial' ? 'no jewelry on body, no accessories, no watches' : 'no clutter, no background'}",
  "technicalSpecs": "Camera: [body], [lens]mm, f/[aperture], ISO [value]. Key light: [position]. Fill: [ratio]. Grade: [style]",
  "layerInstructions": "СЛОЙ 1 — Изделие: прикрепите ваше фото ${product} в центр кадра. СЛОЙ 2 — Логотип: прикрепите логотип Tomiori сверху по центру."
}`;

    const images = [];
    if (productImage) images.push(productImage);
    if (logoImage) images.push(logoImage);

    const raw = await getAIResponse(userPrompt, config, systemPrompt, images);

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}') + 1;
      if (start !== -1 && end > start) {
        result = JSON.parse(raw.substring(start, end));
      } else {
        result = { mainPrompt: raw, negativePrompt: '', technicalSpecs: '', layerInstructions: '' };
      }
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Nano Banana API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
