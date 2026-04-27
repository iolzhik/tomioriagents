import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { openRouterKey } = await req.json();

    if (!openRouterKey) {
      return NextResponse.json({ success: false, error: 'OpenRouter API key is required' }, { status: 400 });
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch models from OpenRouter: ${errorData}`);
    }

    const data = await response.json();
    
    return NextResponse.json({ success: true, models: data.data });

  } catch (error: any) {
    console.error('Fetch Models API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
